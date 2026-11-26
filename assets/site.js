/* ChadGPT Maxxed. Everything shown comes from data/stacks.json. All content is free: no paywall, no sign-up. */
(function () {
  var script = document.currentScript;
  var ROOT = script.getAttribute('data-root') || '';
  var page = document.body.getAttribute('data-page');
  /* Draft view shows unfinished slots in grey. On by default on this computer, or with ?draft=1; off with ?draft=0. */
  var q = new URLSearchParams(location.search).get('draft');
  var DRAFT = q === '1' || (q !== '0' && /^(localhost|127\.0\.0\.1)$/.test(location.hostname));

  function h(tag, attrs, kids) {
    var el = document.createElement(tag);
    for (var k in attrs || {}) {
      if (attrs[k] == null || attrs[k] === false) continue;
      if (k === 'text') el.textContent = attrs[k];
      else if (k === 'style') el.style.cssText = attrs[k];
      else el.setAttribute(k, attrs[k]);
    }
    (kids || []).forEach(function (c) { if (c) el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return el;
  }
  function $(id) { return document.getElementById(id); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function href(s) { return (page === 'home' ? 'stacks/' : '') + s.slug + '.html'; }

  var toastEl, toastT;
  function toast(msg) {
    if (!toastEl) { toastEl = h('div', { class: 'toast', role: 'status' }); document.body.appendChild(toastEl); }
    toastEl.textContent = msg; toastEl.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(function () { toastEl.classList.remove('show'); }, 2200);
  }

  /* line icons, one per stack (24x24, stroke only) */
  var ICONS = {
    'hair': '<path d="M4 5h16M6 5v14M10 5v14M14 5v14M18 5v14"/>',
    'skinmaxx': '<path d="M12 3c3.5 4.2 6 7.3 6 10.5a6 6 0 0 1-12 0C6 10.3 8.5 7.2 12 3z"/><path d="M9.5 14a2.5 2.5 0 0 0 2.5 2.5"/>',
    'lean-mean': '<path d="M3 9v6M6 6v12M18 6v12M21 9v6M6 12h12"/>',
    'primal': '<path d="M13 2 5 13.5h6L10 22l9-12.5h-6.5L13 2z"/>'
  };
  function icon(slug) {
    var s = h('span', { class: 'tile__ico', 'aria-hidden': 'true' });
    s.innerHTML = '<svg viewBox="0 0 24 24">' + (ICONS[slug] || '') + '</svg>';
    return s;
  }
  function checks(items) { return h('ul', { class: 'inside' }, items.map(function (t) { return h('li', { text: t }); })); }

  var STATUS = { established: ['ok', 'Established'], cosmetic: ['ok', 'Cosmetic'], experimental: ['exp', 'Experimental'], prescription: ['rx', 'Prescription'] };
  function tag(status) { var st = STATUS[status]; return st ? h('span', { class: 'tag ' + st[0], text: st[1] }) : null; }

  var cfg = {};

  /* ---- affiliate click tracking: one event per outbound click ---- */
  function track(a) {
    var ev = { event: 'affiliate_click', stack: a.getAttribute('data-stack'), product: a.getAttribute('data-product'), url: a.href, page: location.pathname, at: new Date().toISOString() };
    try { (window.dataLayer = window.dataLayer || []).push(ev); } catch (e) {}
    try { if (window.gtag) window.gtag('event', 'affiliate_click', { stack: ev.stack, product: ev.product, link_url: ev.url }); } catch (e) {}
    try { if (window.plausible) window.plausible('Affiliate Click', { props: { stack: ev.stack, product: ev.product } }); } catch (e) {}
    try { if (cfg.trackEndpoint && navigator.sendBeacon) navigator.sendBeacon(cfg.trackEndpoint, new Blob([JSON.stringify(ev)], { type: 'text/plain' })); } catch (e) {}
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[data-aff]');
    if (a) track(a);
    var c = e.target.closest && e.target.closest('button[data-code]');
    if (c) {
      var code = c.getAttribute('data-code');
      var done = function () { toast('Code ' + code + ' copied'); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(code).then(done, function () { toast('Copy it by hand: ' + code); });
      else toast('Copy it by hand: ' + code);
    }
  });
  function shop(label, link, stack, name) {
    return h('a', { class: 'btn', href: link, target: '_blank', rel: 'noopener sponsored', 'data-aff': '1', 'data-stack': stack.slug, 'data-product': name, text: label });
  }

  /* ---- the reusable product card ---- */
  function productCard(p, stack) {
    return h('article', { class: 'pcard' }, [
      h('div', { class: 'pcard__img' }, [p.image ? h('img', { src: ROOT + p.image, alt: (p.brand ? p.brand + ' ' : '') + p.name, loading: 'lazy' }) : h('span', { class: 'mono', text: p.slot || 'Product' })]),
      h('div', { class: 'pcard__body' }, [
        p.brand ? h('p', { class: 'mono ac', text: p.brand }) : null,
        h('h4', { class: 'D', text: p.name }),
        p.desc ? h('p', { class: 'pcard__desc', text: p.desc }) : null,
        p.why ? h('div', { class: 'pcard__why' }, [h('span', { class: 'mono', text: 'Why I rate it' }), h('p', { text: p.why })]) : null,
        (p.price || p.discount) ? h('dl', { class: 'pcard__meta' }, [
          p.price ? h('div', {}, [h('dt', { text: 'Price' }), h('dd', { text: p.price })]) : null,
          p.discount ? h('div', {}, [h('dt', { text: 'Discount' }), h('dd', { text: p.discount })]) : null
        ]) : null,
        p.code ? h('button', { type: 'button', class: 'code', 'data-code': p.code, 'aria-label': 'Copy discount code ' + p.code }, [h('span', { class: 'mono', text: 'Code' }), h('b', { text: p.code }), h('span', { class: 'mono ac', text: 'Copy' })]) : null,
        p.link ? shop('Shop product →', p.link, stack, p.name) : null
      ])
    ]);
  }

  /* ---- an educational breakdown: never a shop link for experimental or prescription items ---- */
  function infoCard(p, stack) {
    var canShop = p.link && (p.status === 'established' || p.status === 'cosmetic');
    return h('article', { class: 'icard' }, [
      h('h4', { class: 'D', text: p.name }),
      p.lead ? h('p', { class: 'icard__lead mono ac', text: p.lead }) : null,
      p.photo ? photoFig(p.photo) : null
    ].concat(paras(p.body)).concat(paras(p.story)).concat([
      (p.status === 'prescription' && cfg.providerLink) ? h('a', { href: cfg.providerLink, target: '_blank', rel: 'noopener', class: 'ulink', text: 'Get it through a licensed provider →' }) : null,
      canShop ? shop('Shop product →', p.link, stack, p.name) : null
    ]));
  }

  function list(v) { return v == null || v === '' ? [] : (Array.isArray(v) ? v : [v]); }
  function has(v) { return list(v).length > 0; }
  function paras(v) { return list(v).map(function (t) { return h('p', { text: t }); }); }

  function pin(p, on) {
    if (!p || !p.text) return null;
    return h('i', { class: 'pin' + (on ? ' pin--on' : ''), style: 'left:' + p.x + '%;height:' + p.y + '%' }, [h('b', { class: 'mono', text: p.text })]);
  }

  /* a before and after pair; removes itself if either image is missing */
  function photoFig(ph) {
    var fig = h('figure', { class: 'mini' }, [
      h('div', { class: 'mini__pair' }, [
        h('div', {}, [h('img', { src: ROOT + ph.before, alt: 'Chad, ' + (ph.beforeLabel || 'before'), loading: 'lazy' }), h('span', { class: 'mono', text: ph.beforeLabel || 'Before' }), pin(ph.beforePin, false)]),
        h('div', {}, [h('img', { src: ROOT + ph.after, alt: 'Chad, ' + (ph.afterLabel || 'now'), loading: 'lazy' }), h('span', { class: 'mono on', text: ph.afterLabel || 'Now' }), pin(ph.afterPin, true)])
      ]),
      ph.caption ? h('figcaption', {}, [h('span', { text: ph.caption })]) : null
    ]);
    Array.prototype.forEach.call(fig.querySelectorAll('img'), function (im) {
      im.addEventListener('error', function () { if (fig.parentNode) fig.parentNode.removeChild(fig); });
    });
    return fig;
  }

  function ghost(p) {
    var kind = p.type === 'info' ? 'Breakdown to write' : p.type === 'provider' ? 'Provider link to add' : 'Product to add';
    return h('div', { class: 'ghost' }, [h('span', { class: 'mono', text: 'Draft · ' + kind }), h('b', { text: p.slot || p.label || p.name || '' })]);
  }

  function renderItem(p, stack) {
    if (p.type === 'provider') return p.link ? h('a', { class: 'provider', href: p.link, target: '_blank', rel: 'noopener' }, [h('span', { class: 'mono', text: 'Licensed provider' }), h('b', { text: p.label + ' →' })]) : (DRAFT ? ghost(p) : null);
    if (p.type === 'info') return (p.name && (has(p.body) || has(p.story) || p.lead)) ? infoCard(p, stack) : (DRAFT ? ghost(p) : null);
    return p.name ? productCard(p, stack) : (DRAFT ? ghost(p) : null);
  }

  fetch(ROOT + 'data/stacks.json', { cache: 'no-cache' }).then(function (r) { return r.json(); }).then(function (data) {
    var stacks = data.stacks; cfg = data.config || {};

    if (page === 'home') {
      var blocks = $('stacks');
      stacks.forEach(function (s, i) {
        blocks.appendChild(h('a', { class: 'tile', id: s.slug, href: href(s) }, [
          icon(s.slug),
          h('span', { class: 'tile__txt' }, [h('b', { class: 'D', text: s.name }), h('span', { class: 'mono ac', text: s.tagline })]),
          h('span', { class: 'tile__go', 'aria-hidden': 'true', text: '→' })
        ]));
      });
    }

    if (page === 'stack') {
      var slug = document.body.getAttribute('data-stack');
      var s = stacks.filter(function (x) { return x.slug === slug; })[0];
      if (!s) return;
      document.title = s.name + ' | ChadGPT Maxxed';
      $('num').textContent = pad(stacks.indexOf(s) + 1) + ' · ' + s.name;
      $('name').textContent = s.headline;
      $('tagline').textContent = s.sub;
      s.intro.forEach(function (t) { $('intro').appendChild(h('p', { text: t })); });

      (s.photos || []).forEach(function (ph) { $('photos').appendChild(photoFig(ph)); });

      var out = $('sections'), shown = 0;
      s.sections.forEach(function (sec) {
        var nodes = sec.items.map(function (p) { return renderItem(p, s); }).filter(Boolean);
        if (!nodes.length) return;
        shown++;
        out.appendChild(h('section', { class: 'grp' }, [
          sec.title ? h('h2', { class: 'D', text: sec.title }) : null,
          sec.note ? h('p', { class: 'grp__note', text: sec.note }) : null,
          h('div', { class: 'grid' }, nodes)
        ]));
      });
      if (s.outro) out.appendChild(h('section', { class: 'outro' }, [
        h('h2', { class: 'D', text: s.outro.title })
      ].concat(paras(s.outro.lines)).concat([s.outro.fine ? h('p', { class: 'outro__fine', text: s.outro.fine }) : null])));
      if (!shown) out.appendChild(h('p', { class: 'soonnote', text: 'This stack is being loaded up. Check back soon.' }));

      var others = $('others');
      stacks.filter(function (x) { return x !== s; }).forEach(function (x) { others.appendChild(h('a', { href: x.slug + '.html' }, [icon(x.slug), x.name])); });
    }
  }).catch(function () { toast('Could not load the stacks. Refresh the page.'); });
})();
