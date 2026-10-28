import argparse

import numpy as np
from PIL import Image
from scipy import ndimage


def mask_for(rgb, background, threshold):
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    lum = 0.3 * r + 0.59 * g + 0.11 * b
    if background == "warm":
        mask = (b - r) > threshold
    else:
        mask = ((b - (r + g) / 2) < threshold) & (lum < 205)
    mask = ndimage.binary_opening(mask, iterations=2)
    labels, count = ndimage.label(mask)
    sizes = ndimage.sum(mask, labels, range(1, count + 1))
    mask = labels == (int(np.argmax(sizes)) + 1)
    mask = ndimage.binary_closing(mask, iterations=4)
    return ndimage.binary_fill_holes(mask), lum


def main():
    p = argparse.ArgumentParser(description="Cut a jet out of a top-view photo into a grayscale PNG with alpha, nose pointing right.")
    p.add_argument("src")
    p.add_argument("out")
    p.add_argument("--background", choices=["warm", "sky"], required=True)
    p.add_argument("--threshold", type=float, default=10)
    p.add_argument("--rotate", type=float, default=0)
    p.add_argument("--length", type=int, default=512)
    p.add_argument("--range", default="16,196")
    a = p.parse_args()

    rgb = np.asarray(Image.open(a.src).convert("RGB")).astype(np.float32)
    mask, lum = mask_for(rgb, a.background, a.threshold)
    lo, hi = np.percentile(lum[mask], [2, 98])
    dark, light = map(float, a.range.split(","))
    gray = np.clip(dark + (lum - lo) / max(hi - lo, 1) * (light - dark), 0, 255)
    alpha = np.clip(ndimage.gaussian_filter(mask.astype(np.float32), 1.0) * 255, 0, 255)

    image = Image.fromarray(np.dstack([gray, alpha]).astype(np.uint8), "LA")
    if a.rotate:
        image = image.rotate(a.rotate, expand=True, resample=Image.BICUBIC)
    box = image.getchannel("A").point(lambda v: 255 if v > 8 else 0).getbbox()
    image = image.crop(box)
    w, h = image.size
    image = image.resize((a.length, round(h * a.length / w)), Image.LANCZOS)
    image.save(a.out)
    print(a.out, image.size, f"jet pixels {int(mask.sum())}")


if __name__ == "__main__":
    main()
