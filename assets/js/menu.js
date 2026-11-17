// Site menu: adds the Menu button and its slide-in sidebar to whatever page loads this script
// (styles in assets/css/menu.css). The page list lives here only, so adding a page to PAGES puts
// it in every page's menu.
(function () {
  var PAGES = [
    { href: '/#projects', label: 'Projects' }, // the Projects section of the home page
    { href: '/resume/', label: 'Resume' },
    { href: '/contact/', label: 'Contact' },
  ];
  var HOME = { href: '/', label: 'NathanielBudz.com' };

  // This page's path in the same form as the hrefs above ("/resume/index.html" -> "/resume/").
  var here = location.pathname.replace(/index\.html$/, '');
  if (here.slice(-1) !== '/') here += '/';
  var current = function (href) { return href === here ? ' aria-current="page"' : ''; };

  var links = PAGES.map(function (p, i) {
    return '<li style="--i:' + i + '"><a href="' + p.href + '"' + current(p.href) + '>' +
      '<span class="menu-num">' + ('0' + (i + 1)).slice(-2) + '</span>' +
      '<span class="menu-text">' + p.label + '</span></a></li>';
  }).join('');

  // First in the body so the button comes first in tab order, ahead of the page.
  document.body.insertAdjacentHTML('afterbegin',
    '<div class="menu-bar"><button class="menu-toggle" type="button" aria-expanded="false" aria-controls="site-menu">' +
      '<span class="menu-toggle-label">Menu</span></button></div>' +
    '<div class="menu-scrim" aria-hidden="true"></div>' +
    '<nav class="menu" id="site-menu" aria-label="Site" inert><div class="menu-inner">' +
      '<a class="menu-home" href="' + HOME.href + '"' + current(HOME.href) + '>' + HOME.label + '</a>' +
      '<div class="menu-main"><p class="menu-label">Pages</p><ul class="menu-links">' + links + '</ul></div>' +
      '<div class="menu-side"><p class="menu-label">Now</p>' +
        '<p>Co-Founder &amp; Integration Engineer at ASTRO Systems.</p>' +
        '<a href="https://astrosystems.us">astrosystems.us <span aria-hidden="true">↗</span></a></div>' +
    '</div></nav>');

  var bar = document.querySelector('.menu-bar');
  var btn = document.querySelector('.menu-toggle');
  var label = btn.querySelector('.menu-toggle-label');
  var scrim = document.querySelector('.menu-scrim');
  var menu = document.getElementById('site-menu');
  var open = false, openY = 0;

  // Bar states: see-through at the very top, hidden while scrolling down, back on a solid strip
  // while scrolling up. TOP is how close to the top counts as "at the top"; NUDGE ignores tiny
  // scrolls (a phone's address bar sliding in and out).
  var TOP = 8, NUDGE = 6, lastY = scrollY;
  var show = function (solid) {
    bar.classList.remove('is-hidden');
    bar.classList.toggle('is-solid', solid);
  };
  var follow = function () {
    var y = scrollY, dy = y - lastY;
    if (y <= TOP) { show(false); lastY = y; }
    else if (dy > NUDGE) { if (y > bar.offsetHeight) bar.classList.add('is-hidden'); lastY = y; }
    else if (dy < -NUDGE) { show(true); lastY = y; }
  };
  if (scrollY > TOP) show(true); // e.g. a reload that lands mid-page

  var set = function (on, refocus) {
    if (on === open) return;
    open = on;
    menu.classList.toggle('is-open', on);
    scrim.classList.toggle('is-open', on);
    menu.inert = !on;
    btn.setAttribute('aria-expanded', String(on));
    label.textContent = on ? 'Close' : 'Menu';
    // While open, CLOSE floats see-through over the sidebar; afterwards the bar picks up again
    // from wherever the page is.
    if (on) { openY = scrollY; show(false); }
    else { lastY = scrollY; show(scrollY > TOP); }
    if (!on && (refocus || menu.contains(document.activeElement))) btn.focus({ preventScroll: true });
  };
  // Tabbing to the button brings the bar back if it had slid away.
  btn.addEventListener('focus', function () { if (!open && bar.classList.contains('is-hidden')) show(scrollY > TOP); });

  btn.addEventListener('click', function () { set(!open); });
  scrim.addEventListener('click', function () { set(false, true); });
  // A link to the page you're already on just closes the menu; a link to a section of this page
  // (Projects, from the home page) closes it and lets the page scroll there.
  menu.addEventListener('click', function (e) {
    var a = e.target.closest('a');
    if (!a) return;
    if (a.getAttribute('aria-current') === 'page') { e.preventDefault(); set(false, true); }
    else if (a.hash && a.pathname === location.pathname) set(false);
  });
  document.addEventListener('keydown', function (e) {
    if (!open) return;
    if (e.key === 'Escape') { set(false, true); return; }
    if (e.key !== 'Tab') return;
    // Keep Tab inside the open menu: the button, then the sidebar's links, then back around.
    var items = [btn].concat([].slice.call(menu.querySelectorAll('a')));
    var i = items.indexOf(document.activeElement), last = items.length - 1;
    if (i < 0 || (e.shiftKey && i === 0) || (!e.shiftKey && i === last)) {
      e.preventDefault();
      items[i < 0 ? 0 : e.shiftKey ? last : 0].focus();
    }
  });
  // The page isn't locked while the menu is open (that would change the page width under the
  // fixed canvases on Windows); scrolling it away closes the menu instead.
  addEventListener('scroll', function () {
    if (open) { if (Math.abs(scrollY - openY) > 80) set(false); return; }
    follow();
  }, { passive: true });
})();
