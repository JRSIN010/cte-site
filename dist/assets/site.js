// Conspiracy Theories Explained — small helpers. No tracking, no cookies.
(function () {
  var preview = document.documentElement.hasAttribute('data-preview');

  // 1. Videos: the YouTube player loads only after a click (faster pages, better privacy).
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-yt]');
    if (!t || preview) return; // in the preview the link simply opens YouTube
    e.preventDefault();
    var f = document.createElement('iframe');
    f.src = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(t.getAttribute('data-yt')) + '?autoplay=1&rel=0';
    f.title = t.getAttribute('aria-label') || 'Video';
    f.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    f.allowFullscreen = true;
    t.appendChild(f);
    t.removeAttribute('data-yt');
  });

  // 2. Forms: show a clear note when a form is not connected yet.
  document.addEventListener('submit', function (e) {
    var form = e.target;
    if (!form.matches('[data-form]')) return;
    var msg = form.querySelector('.form-msg');
    var hp = form.querySelector('.hp input');
    if (hp && hp.value) { e.preventDefault(); return; } // spam trap
    if (preview || !form.getAttribute('action')) {
      e.preventDefault();
      if (msg) {
        msg.hidden = false;
        msg.textContent = preview
          ? 'This is the preview. On the live site, this form sends for real once you connect it (see the Go-Live Guide).'
          : 'This form is not connected yet. Please email us instead.';
      }
    }
  });

  // 3. Preview only: show one page at a time, picked by the #name in the address.
  if (preview) {
    var pages = document.querySelectorAll('.pv');
    var show = function () {
      var name = (location.hash || '#home').slice(1);
      var target = document.getElementById('pv-' + name) || document.getElementById('pv-home');
      pages.forEach(function (p) { p.hidden = p !== target; });
      document.querySelectorAll('.nav a').forEach(function (a) {
        if (a.getAttribute('href') === '#' + target.id.slice(3)) a.setAttribute('aria-current', 'page');
        else a.removeAttribute('aria-current');
      });
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', show);
    show();
  }
})();
