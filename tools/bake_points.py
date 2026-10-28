import argparse
import json
from pathlib import Path

import numpy as np
import trimesh
from PIL import Image
from scipy import ndimage

TAGS = {"body": 0, "canopy": 1, "dark": 2, "light": 3, "nav_red": 4, "nav_green": 5, "glow": 6, "edge": 7}
MATERIAL_TAGS = {
    "window": "canopy",
    "dark": "dark",
    "darkmet": "dark",
    "darkmet2": "dark",
    "lightmet": "light",
    "lightRed": "nav_red",
    "lightGreen": "nav_green",
    "glow": "glow",
}
SPECIAL = {"nav_red", "nav_green", "glow"}


def axis_matrix(spec):
    m = np.zeros((3, 3))
    for row, term in enumerate(spec.split(",")):
        term = term.strip()
        sign = -1.0 if term.startswith("-") else 1.0
        m[row, "xyz".index(term.lstrip("+-"))] = sign
    return m


def from_model(args, rng):
    rotation = axis_matrix(args.axes)
    transform = np.eye(4)
    transform[:3, :3] = rotation
    loaded = trimesh.load(args.source)
    drop = set(filter(None, args.drop.split(",")))
    parts = []
    if isinstance(loaded, trimesh.Scene):
        for node in loaded.graph.nodes_geometry:
            if node in drop:
                continue
            tf, name = loaded.graph[node]
            mesh = loaded.geometry[name].copy()
            mesh.apply_transform(tf)
            material = getattr(getattr(mesh.visual, "material", None), "name", "") or ""
            parts.append((mesh, MATERIAL_TAGS.get(material.split(".")[0], "body")))
    else:
        parts.append((loaded, "body"))
    for mesh, _ in parts:
        mesh.apply_transform(transform)
        if np.linalg.det(rotation) < 0:
            mesh.invert()
    lo, hi = trimesh.util.concatenate([m for m, _ in parts]).bounds
    center = (lo + hi) / 2
    scale = 2.0 / (hi[0] - lo[0])
    for mesh, _ in parts:
        mesh.apply_translation(-center)
        mesh.apply_scale(scale)

    specials = [(m, t) for m, t in parts if t in SPECIAL]
    special_count = args.special * len(specials)
    edge_count = int((args.count - special_count) * args.edges)
    surface_count = args.count - special_count - edge_count
    areas = np.array([m.area for m, _ in parts])
    split = rng.multinomial(surface_count, areas / areas.sum())
    points, normals, tags = [], [], []
    for (mesh, tag), n in zip(parts, split):
        if n:
            p, face = trimesh.sample.sample_surface(mesh, n, seed=int(rng.integers(1 << 31)))
            points.append(p)
            normals.append(mesh.face_normals[face])
            tags.append(np.full(n, TAGS[tag]))
    for mesh, tag in specials:
        p, face = trimesh.sample.sample_surface(mesh, args.special, seed=int(rng.integers(1 << 31)))
        points.append(p)
        normals.append(mesh.face_normals[face])
        tags.append(np.full(len(p), TAGS[tag]))

    segments = []
    for mesh, tag in parts:
        if tag in SPECIAL:
            continue
        m = mesh.copy()
        m.merge_vertices()
        if len(m.face_adjacency):
            sharp = m.face_adjacency_angles > np.radians(38)
            segments.append(m.vertices[m.face_adjacency_edges[sharp]])
        boundary = trimesh.grouping.group_rows(m.edges_sorted, require_count=1)
        if len(boundary):
            segments.append(m.vertices[m.edges_sorted[boundary]])
    segments = np.concatenate(segments)
    lengths = np.linalg.norm(segments[:, 1] - segments[:, 0], axis=1)
    pick = rng.choice(len(segments), size=edge_count, p=lengths / lengths.sum())
    t = rng.random((edge_count, 1))
    points.append(segments[pick, 0] * (1 - t) + segments[pick, 1] * t)
    normals.append(np.tile([0.0, 1.0, 0.0], (edge_count, 1)))
    tags.append(np.full(edge_count, TAGS["edge"]))

    points = np.concatenate(points)
    normals = np.concatenate(normals)
    tags = np.concatenate(tags)
    light = np.array([0.35, 1.0, 0.25])
    light /= np.linalg.norm(light)
    shade = np.clip(0.34 + 0.46 * np.clip(normals @ light, 0, 1) + 0.12 * np.clip(normals[:, 0], 0, 1), 0, 1)
    shade[tags == TAGS["edge"]] = 0.92
    shade[tags == TAGS["dark"]] *= 0.72
    return points, shade, tags


def from_image(args, rng):
    image = Image.open(args.source).convert("LA")
    gray = np.asarray(image.getchannel("L")).astype(np.float32) / 255
    alpha = np.asarray(image.getchannel("A")).astype(np.float32) / 255
    h, w = alpha.shape
    inside = alpha > 0.5
    rows, cols = np.nonzero(inside)
    axis = rows.mean()
    edge_mask = inside & ~ndimage.binary_erosion(inside, iterations=1)
    edge_count = int(args.count * args.edges)
    surface_count = args.count - edge_count

    def to_points(r, c):
        jitter = rng.random((len(r), 2))
        x = ((c + jitter[:, 0]) / w) * 2 - 1
        z = ((r + jitter[:, 1] - axis) / w) * 2
        y = rng.normal(0, 0.004, len(r))
        return np.stack([x, y, z], axis=1)

    weights = alpha[rows, cols]
    pick = rng.choice(len(rows), size=surface_count, p=weights / weights.sum())
    er, ec = np.nonzero(edge_mask)
    epick = rng.choice(len(er), size=edge_count)
    points = np.concatenate([to_points(rows[pick], cols[pick]), to_points(er[epick], ec[epick])])
    darkness = 1 - np.concatenate([gray[rows[pick], cols[pick]], gray[er[epick], ec[epick]]])
    shade = np.clip(0.3 + 0.7 * darkness, 0, 1)
    tags = np.concatenate([np.zeros(surface_count, int), np.full(edge_count, TAGS["edge"])])
    shade[tags == TAGS["edge"]] = 0.92
    if args.canopy:
        x0, x1, zw, dark = map(float, args.canopy.split(","))
        hit = (points[:, 0] > x0) & (points[:, 0] < x1) & (np.abs(points[:, 2]) < zw) & (darkness > dark)
        tags[hit & (tags == 0)] = TAGS["canopy"]
    return points, shade, tags


def bake(args):
    rng = np.random.default_rng(args.seed)
    points, shade, tags = from_image(args, rng) if args.image else from_model(args, rng)

    if not np.any(tags == TAGS["nav_red"]):
        replace = rng.choice(np.flatnonzero(tags == TAGS["body"]), size=2 * args.special, replace=False)
        extra = []
        for side in (-1, 1):
            tip = points[np.argmax(points[:, 2] * side)]
            extra.append(tip + rng.normal(0, 0.004, (args.special, 3)))
        points[replace] = np.concatenate(extra)
        tags[replace] = np.repeat([TAGS["nav_red"], TAGS["nav_green"]], args.special)
        shade[replace] = 1.0

    order = np.argsort(points[:, 0], kind="stable")
    bins = np.array_split(order, 120)
    order = np.concatenate([b[np.argsort(np.arctan2(points[b, 1], points[b, 2]))] for b in bins])
    points, shade, tags = points[order], shade[order], tags[order]

    if args.nozzles:
        nozzles = [[float(v) for v in n.split(",")] for n in args.nozzles.split(";")]
    else:
        tube = (np.abs(points[:, 2]) < args.nozzle_span) & (np.abs(points[:, 1] - args.nozzle_y) < 0.08)
        core = tube & (points[:, 0] < points[tube, 0].min() + 0.05)
        groups = [core & (points[:, 2] < 0), core & (points[:, 2] > 0)] if args.engines == 2 else [core]
        nozzles = []
        for g in groups:
            c = points[g].mean(axis=0)
            c[0] = points[g][:, 0].min()
            r = float(np.median(np.linalg.norm(points[g][:, 1:] - c[1:], axis=1)))
            nozzles.append([*map(float, c), r])
    tips = [points[tags == TAGS[t]].mean(axis=0).tolist() for t in ("nav_red", "nav_green")]

    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    record = np.zeros(len(points), dtype=[("p", "<i2", 3), ("shade", "u1"), ("tag", "u1")])
    record["p"] = np.round(np.clip(points, -1, 1) * 32767).astype("<i2")
    record["shade"] = np.round(shade * 255).astype("u1")
    record["tag"] = tags.astype("u1")
    out.write_bytes(record.tobytes())

    manifest_path = out.parent / "jets.json"
    manifest = json.loads(manifest_path.read_text()) if manifest_path.exists() else {"jets": []}
    entry = {
        "id": args.id,
        "name": args.name,
        "file": out.name,
        "count": len(points),
        "scale": args.scale,
        "nozzles": [[round(v, 4) for v in n] for n in nozzles],
        "tips": [[round(v, 4) for v in t] for t in tips],
        "credit": args.credit or None,
    }
    manifest["jets"] = [j for j in manifest["jets"] if j["id"] != args.id] + [entry]
    manifest_path.write_text(json.dumps(manifest, indent=2))
    print(json.dumps(entry))
    print("tags", {k: int((tags == v).sum()) for k, v in TAGS.items()}, "bytes", out.stat().st_size)


def main():
    p = argparse.ArgumentParser(description="Bake a jet into a point cloud from a 3D model or a top-view cutout image.")
    p.add_argument("source")
    p.add_argument("out")
    p.add_argument("--id", required=True)
    p.add_argument("--name", required=True)
    p.add_argument("--image", action="store_true")
    p.add_argument("--axes", default="x,y,z")
    p.add_argument("--drop", default="")
    p.add_argument("--count", type=int, default=30000)
    p.add_argument("--edges", type=float, default=0.22)
    p.add_argument("--special", type=int, default=24)
    p.add_argument("--canopy", default="")
    p.add_argument("--engines", type=int, default=1)
    p.add_argument("--nozzle-span", type=float, default=0.12)
    p.add_argument("--nozzle-y", type=float, default=0.0)
    p.add_argument("--nozzles", default="")
    p.add_argument("--scale", type=float, default=1.0)
    p.add_argument("--credit", default="")
    p.add_argument("--seed", type=int, default=7)
    bake(p.parse_args())


if __name__ == "__main__":
    main()
