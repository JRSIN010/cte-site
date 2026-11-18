#!/usr/bin/env node
/* Conspiracy Theories Explained — site builder. No installs needed: just run `node build.js`.
   Reads /content, /assets, /images, /downloads and writes:
     dist/      the real website (upload or deploy this folder)
     preview/   a one-file copy for looking at the site before it is live
     GO-LIVE-GUIDE.html   the launch guide, ready to read or print            */
const fs = require('fs'), path = require('path');
const ROOT = __dirname, C = p => path.join(ROOT, 'content', p);
const read = p => fs.readFileSync(p, 'utf8');
const json = p => JSON.parse(read(C(p)));
const site = json('site.json'), books = json('books.json'), videos = json('videos.json'), magnets = json('magnets.json'), home = json('home.json'), pg = json('other-pages.json');
const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const hl = t => esc(t).replace(/\*([^*]+)\*/g, '<em>$1</em>'); // *stars* make words red
const exists = p => fs.existsSync(path.join(ROOT, p));

// ---------- pages and where they live ----------
const PATHS = { home: '/', videos: '/videos/', books: '/books/', blog: '/blog/', about: '/about/', contact: '/contact/', free: '/free/', thanks: '/thanks/',
  privacy: '/privacy/', terms: '/terms/', disclaimer: '/disclaimer/', 'affiliate-disclosure': '/affiliate-disclosure/', cookies: '/cookies/', refunds: '/refunds/' };
books.forEach(b => PATHS['book-' + b.slug] = '/books/' + b.slug + '/');

function frontMatter(file) {
  const raw = read(file), m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/), meta = {};
  if (!m) return { meta, body: raw };
  m[1].split('\n').forEach(l => { const i = l.indexOf(': '); if (i > 0) meta[l.slice(0, i).trim()] = l.slice(i + 2).trim(); });
  return { meta, body: m[2] };
}
const posts = fs.readdirSync(C('posts')).filter(f => f.endsWith('.md') && !/^draft: *true *$/m.test(read(C('posts/' + f)).split(/\n---/)[0])).map(f => {
  const { meta, body } = frontMatter(C('posts/' + f)), slug = f.replace(/\.md$/, '');
  PATHS['post-' + slug] = '/blog/' + slug + '/';
  return { slug, ...meta, body };
}).sort((a, b) => (a.date < b.date ? 1 : -1));
const fmtDate = d => { const [y, m, day] = d.split('-').map(Number); return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][m - 1] + ' ' + day + ', ' + y; };

// ---------- tiny markdown ----------
function md(src, ctx) {
  const inline = t => esc(t)
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, txt, u) => u.startsWith('page:') ? `<a href="${ctx.url(u.slice(5))}">${txt}</a>` : `<a href="${u}" rel="noopener">${txt}</a>`)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/(^|[\s(])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>');
  const out = [], lines = src.replace(/\r/g, '').split('\n'); let i = 0;
  while (i < lines.length) {
    const l = lines[i];
    if (!l.trim()) { i++; continue; }
    let m;
    if ((m = l.match(/^(#{2,3}) (.*)/))) { out.push(`<h${m[1].length}>${inline(m[2])}</h${m[1].length}>`); i++; }
    else if (/^---+$/.test(l.trim())) { out.push('<hr>'); i++; }
    else if (/^\|/.test(l)) {
      const rows = []; while (i < lines.length && /^\|/.test(lines[i])) rows.push(lines[i++].trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim()));
      const head = rows[0], bodyRows = rows.slice(2);
      out.push('<div class="tablewrap"><table><thead><tr>' + head.map(c => `<th>${inline(c)}</th>`).join('') + '</tr></thead><tbody>' +
        bodyRows.map(r => '<tr>' + r.map(c => `<td>${inline(c)}</td>`).join('') + '</tr>').join('') + '</tbody></table></div>');
    }
    else if (/^(- |\d+\. )/.test(l)) {
      const ord = /^\d/.test(l), items = [];
      while (i < lines.length && (ord ? /^\d+\. /.test(lines[i]) : /^- /.test(lines[i]))) items.push(lines[i++].replace(/^(- |\d+\. )/, ''));
      out.push(`<${ord ? 'ol' : 'ul'}>` + items.map(t => `<li>${inline(t)}</li>`).join('') + `</${ord ? 'ol' : 'ul'}>`);
    }
    else if (/^> /.test(l)) { const q = []; while (i < lines.length && /^> /.test(lines[i])) q.push(lines[i++].slice(2)); out.push(`<blockquote><p>${inline(q.join(' '))}</p></blockquote>`); }
    else { const p = []; while (i < lines.length && lines[i].trim() && !/^(#{2,3} |- |\d+\. |> |\||---+$)/.test(lines[i])) p.push(lines[i++]); out.push(`<p>${inline(p.join(' '))}</p>`); }
  }
  return out.join('\n');
}
const fill = t => t.replace(/\{\{(\w+)\}\}/g, (_, k) => ({
  company: site.company, email: site.contactEmail, updated: site.legalUpdated, law: site.governingLaw,
  store: site.directStoreName ? ' and ' + site.directStoreName : '',
  affiliate: site.amazonAssociate
    ? 'Some links to Amazon are affiliate links. As an Amazon Associate I earn from qualifying purchases. This costs you nothing extra.'
    : 'Links to Amazon and other stores go to our own books. We do not earn affiliate commissions from any link on this site right now. If that changes, we will say so here.'
}[k] ?? ''));

// ---------- shared pieces ----------
const SEAL = `<svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="48" fill="#171411"/><circle cx="50" cy="50" r="45" fill="none" stroke="#e8dcc0" stroke-width="2.5"/><circle cx="50" cy="50" r="40" fill="none" stroke="#e8dcc0" stroke-width=".8"/><text x="50" y="57" text-anchor="middle" font-family="Anton,Impact,'Arial Narrow',sans-serif" font-size="34" letter-spacing="1" fill="#e8dcc0">CTE</text><rect x="22" y="64" width="56" height="11" fill="#b5241f" transform="rotate(-3 50 69)"/><text x="50" y="72.5" text-anchor="middle" font-family="'Special Elite','Courier New',monospace" font-size="7" letter-spacing="1" fill="#f1e6cc" transform="rotate(-3 50 69)">DECLASSIFIED</text></svg>`;
const DEFS = `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><filter id="worn" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="3" seed="11" result="n"/><feColorMatrix in="n" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 -5 3.6" result="m"/><feComposite in="SourceGraphic" in2="m" operator="in"/></filter></svg>`;
const TAG = esc(site.tagline).replace(/You Decide\.*/, m => '<b>' + m + '</b>');
let uid = 0;

function signup(ctx, button) {
  const id = 'email-' + (++uid), a = site.newsletter.action;
  return `<form class="signup" data-form="newsletter" method="post"${a ? ` action="${esc(a)}"` : ''}>
<label class="sr" for="${id}">Your email</label>
<input type="email" id="${id}" name="${esc(site.newsletter.emailField)}" placeholder="you@email.com" autocomplete="email" required>
<button class="btn" type="submit">${button}</button>
<p class="form-msg" role="status" hidden></p>
</form>
<p class="fine">${esc(home.freeDownload.smallPrint)} <a href="${ctx.url('privacy')}">Privacy Policy</a>.</p>`;
}

function thumb(v, ctx) {
  const cls = `thumb t-${v.style === 'gray' ? 'gray' : 'cork'}${v.short ? ' short' : ''}`;
  const art = `<span class="badge">CTE</span><span class="pinv"></span>
<span class="photo">${v.style === 'gray' ? `<span class="ph">${esc(v.stamp)}</span>` : '<span class="ph"><i style="width:80%"></i><i style="width:55%"></i><i style="width:70%"></i></span>'}<small>${esc(v.note)}</small></span>
<span class="ttl"><span>${esc(v.line1)}</span><span>${esc(v.line2)}</span></span>
<span class="cat">${esc(v.category)} · CASE FILE ${esc(v.caseNo)}</span>`;
  if (!v.youtubeId) return `<div class="${cls} soon" role="img" aria-label="${esc(v.title)}. Video coming soon.">${art}<span class="play">${esc(pg.videoCards.comingSoon)}</span></div>`;
  const real = ctx.preview ? '' : `<img class="real" src="https://i.ytimg.com/vi/${esc(v.youtubeId)}/hqdefault.jpg" alt="" loading="lazy">`;
  return `<a class="${cls}" href="https://www.youtube.com/watch?v=${esc(v.youtubeId)}" data-yt="${esc(v.youtubeId)}" aria-label="Play video: ${esc(v.title)}" rel="noopener">${art}${real}<span class="play">${esc(pg.videoCards.play)}</span></a>`;
}
function vcard(v, ctx) {
  const b = books.find(x => x.slug === v.book);
  return `<article class="vcard">${thumb(v, ctx)}<div class="txt"><h3>${esc(v.title)}</h3><p>${esc(v.summary)}</p>${b ? `<a class="more" href="${ctx.url('book-' + b.slug)}">${esc(pg.videoCards.fromTheBook)} ${esc(b.title)} &rarr;</a>` : ''}</div></article>`;
}
function cover(b, ctx, link) {
  const tag = link ? 'a' : 'div', href = link ? ` href="${ctx.url('book-' + b.slug)}" aria-label="${esc(b.title)}"` : '';
  if (b.cover && exists('images/' + b.cover)) return `<${tag} class="cover img"${href}><img src="${ctx.asset('images/' + b.cover)}" alt="Cover of ${esc(b.title)}"></${tag}>`;
  const long = b.coverLines.some(l => l.length > 9);
  return `<${tag} class="cover"${href}><span class="c-label">${esc(b.caseLabel)}</span>
<span class="c-title${long ? ' long' : ''}">${b.coverLines.map((l, i) => `<span${i === b.redLine && !long ? ' class="r"' : ''}>${esc(l)}</span>`).join('')}</span>
<span class="c-stamp">${esc(b.stamp)}</span><span class="c-author">${esc(b.author)}</span></${tag}>`;
}
function buyButtons(b, ctx) {
  const out = [];
  if (b.amazonUrl) out.push(`<a class="btn" href="${esc(b.amazonUrl)}" rel="noopener">${esc(home.buyButtons.amazon)}</a>`);
  if (b.directUrl) out.push(`<a class="btn paper" href="${esc(b.directUrl)}" rel="noopener">${esc(home.buyButtons.direct)}</a>`);
  if (!out.length) out.push(`<a class="btn" href="${ctx.url('free')}">${esc(home.buyButtons.notify)}</a>`);
  return out.join('\n');
}
const pageHead = (label, h1, sub) => `<header class="page-head"><div class="wrap"><p class="label">${esc(label)}</p><h1>${h1}</h1>${sub ? `<p>${esc(sub)}</p>` : ''}</div></header>`;
const pcard = (p, ctx) => `<a class="pcard" href="${ctx.url('post-' + p.slug)}"><span class="pin c"></span><span class="k">${esc(p.tag)}</span><h3>${esc(p.title)}</h3><p>${esc(p.description)}</p><span class="d">${fmtDate(p.date).toUpperCase()}</span></a>`;
const magnetBand = ctx => `<section class="band"><div class="wrap magnet">
<div class="doc" aria-hidden="true"><span class="pin c"></span><p class="label">${esc(home.freeDownload.cardLabel)}</p><h3>${esc(home.freeDownload.cardTitle)}</h3>
<ol>${home.freeDownload.cardItems.map(i => `<li>${esc(i)}</li>`).join('')}</ol><p>${esc(home.freeDownload.cardMore)}</p><span class="stamp">${esc(home.freeDownload.cardStamp)}</span></div>
<div class="copy"><p class="label">${esc(home.freeDownload.label)}</p><h2 class="h-sec">${hl(home.freeDownload.headline)}</h2>
<p class="lede">${esc(home.freeDownload.text)}</p>
${signup(ctx, esc(home.freeDownload.button))}</div></div></section>`;

// ---------- page bodies ----------
function pages(ctx) {
  const P = [], add = (slug, title, desc, body, extra) => P.push({ slug, title, desc, body, ...extra });
  const yt = site.social.youtube;

  add('home', '', site.description, `
<section class="band cork hero"><div class="wrap">
<div class="wall" aria-hidden="true">
<svg viewBox="0 0 1000 500" preserveAspectRatio="none"><g stroke="#a51d17" stroke-width="2.5" fill="none" vector-effect="non-scaling-stroke"><path d="M70 70 L190 150" vector-effect="non-scaling-stroke"/><path d="M70 70 L60 330" vector-effect="non-scaling-stroke"/><path d="M60 330 L185 400" vector-effect="non-scaling-stroke"/><path d="M940 170 L815 150" vector-effect="non-scaling-stroke"/><path d="M940 170 L950 380" vector-effect="non-scaling-stroke"/><path d="M950 380 L815 420" vector-effect="non-scaling-stroke"/></g></svg>
<div class="note" style="left:2%;top:14%;transform:rotate(-4deg)"><span class="pin c"></span><b>CASE FILE NO. 001</b>SUBJECT: <i style="width:5rem"></i><br>STATUS: <span class="r">UNSOLVED</span><br><i style="width:90%"></i><br><i style="width:65%"></i></div>
<div class="note" style="right:2%;top:30%;transform:rotate(3deg)"><span class="pin c"></span><b>EVIDENCE</b>CASE: [OPEN]<br>LOCATION: <i style="width:4rem"></i><br>CLASSIFICATION: <span class="r">SECRET</span></div>
<span class="city" style="left:3%;top:70%;transform:rotate(2deg)">DALLAS</span><span class="city" style="left:10%;top:84%;transform:rotate(-2deg)">ROSWELL</span>
<span class="city" style="right:3%;top:74%;transform:rotate(-2deg)">DETROIT</span><span class="city" style="right:9%;top:83%;transform:rotate(2deg)">JERUSALEM</span>
</div>
<div class="plate"><span class="pin"></span><span class="pin"></span><span class="pin"></span><span class="pin"></span>
<p class="label">${esc(home.hero.label)}</p>
<h1>${esc(home.hero.titleLine1)} <span>${esc(home.hero.titleLine2)}</span></h1>
<hr class="rule">
<p class="tag">${TAG}</p>
<p class="sub">${esc(home.hero.intro)}</p>
<div class="cta"><a class="btn" href="${ctx.url('videos')}">${esc(home.hero.button1)}</a><a class="btn paper" href="${ctx.url('free')}">${esc(home.hero.button2)}</a></div>
</div>
<div class="newcase" aria-hidden="true"><span>★ ★ ★</span><b>${esc(home.hero.stampBig)}</b><span>${esc(home.hero.stampSmall)}</span></div>
</div></section>

<section class="band gray-ctx"><div class="wrap">
<div class="band-head"><p class="label">${esc(home.videos.label)}</p><h2 class="h-sec">${hl(home.videos.headline)}</h2></div>
<div class="grid">${videos.filter(v => !v.short).slice(0, 3).map(v => vcard(v, ctx)).join('')}</div>
<div class="band-foot"><a class="btn" href="${ctx.url('videos')}">${esc(home.videos.button)}</a>${yt ? `<a class="btn paper" href="${esc(yt)}" rel="noopener">${esc(home.videos.subscribeButton)}</a>` : ''}</div>
</div></section>

<section class="band cork"><div class="wrap">
<div class="band-head"><p class="label">${esc(home.steps.label)}</p><h2 class="h-sec">${hl(home.steps.headline)}</h2></div>
<ol class="steps">
${home.steps.items.map((it, i) => `<li><span class="pin c"></span><span class="n">STEP 0${i + 1}</span><h3>${esc(it.title)}</h3><p>${esc(it.text)}</p></li>`).join('\n')}
</ol></div></section>

<section class="band dark"><div class="wrap">
<div class="band-head"><p class="label">${esc(home.books.label)}</p><h2 class="h-sec">${hl(home.books.headline)}</h2><p class="lede">${esc(home.books.intro.replace('{author}', site.author))}</p></div>
<div class="shelf">${books.map(b => `<article class="bcard">${cover(b, ctx, true)}<p class="status">${esc(b.status)}</p><h3><a href="${ctx.url('book-' + b.slug)}">${esc(b.title)}</a></h3><p>${esc(b.blurb)}</p><div class="acts"><a class="btn small paper" href="${ctx.url('book-' + b.slug)}">${esc(home.books.button)}</a></div></article>`).join('')}</div>
</div></section>
${magnetBand(ctx)}
<section class="band cork"><div class="wrap">
<div class="band-head"><p class="label">${esc(home.blog.label)}</p><h2 class="h-sec">${hl(home.blog.headline)}</h2></div>
<div class="posts">${posts.slice(0, 3).map(p => pcard(p, ctx)).join('')}</div>
<div class="band-foot"><a class="btn" href="${ctx.url('blog')}">${esc(home.blog.button)}</a></div>
</div></section>`);

  const longs = videos.filter(v => !v.short), shorts = videos.filter(v => v.short);
  add('videos', 'Videos', 'Every case file video and Short from Conspiracy Theories Explained.', pageHead(pg.videosPage.label, esc(pg.videosPage.title), pg.videosPage.intro) + `
<section class="band cork"><div class="wrap"><div class="grid">${longs.map(v => vcard(v, ctx)).join('')}</div>
${shorts.length ? `<div class="band-head" style="margin-top:3rem"><p class="label">${esc(pg.videosPage.shortsLabel)}</p><h2 class="h-sec">${hl(pg.videosPage.shortsHeadline)}</h2></div><div class="grid">${shorts.map(v => vcard(v, ctx)).join('')}</div>` : ''}
${yt ? `<div class="band-foot"><a class="btn" href="${esc(yt)}" rel="noopener">${esc(home.videos.subscribeButton)}</a></div>` : ''}</div></section>${magnetBand(ctx)}`);

  add('books', 'Books', `Nonfiction books by ${site.author}: real cases, real documents, both sides.`, pageHead(pg.booksPage.label, esc(pg.booksPage.title.replace('{author}', site.author)), pg.booksPage.intro) + `
<section class="band"><div class="wrap"><div class="shelf">${books.map(b => `<article class="bcard">${cover(b, ctx, true)}<p class="status">${esc(b.status)}</p><h3><a href="${ctx.url('book-' + b.slug)}">${esc(b.title)}</a></h3>${b.subtitle ? `<p><em>${esc(b.subtitle)}</em></p>` : ''}<p>${esc(b.blurb)}</p><div class="acts">${buyButtons(b, ctx)}<a class="btn small paper" href="${ctx.url('book-' + b.slug)}">${esc(pg.booksPage.detailsButton)}</a></div></article>`).join('')}</div></div></section>${magnetBand(ctx)}`);

  books.forEach(b => {
    const vids = videos.filter(v => v.book === b.slug);
    add('book-' + b.slug, b.title, b.blurb, `
<section class="band"><div class="wrap bookpage">${cover(b, ctx, false)}
<div class="info"><p class="label">${esc(b.caseLabel)}</p><h1>${esc(b.title)}</h1>${b.subtitle ? `<p class="subt">${esc(b.subtitle)}</p>` : ''}
<p class="status">${esc(b.status)} · ${esc(pg.bookPage.by)} ${esc(b.author)}</p><p class="lede">${esc(b.blurb)}</p>
<div class="buy">${buyButtons(b, ctx)}</div>${b.formats ? `<p class="fine">${esc(pg.bookPage.formats)} ${esc(b.formats)}</p>` : ''}
<h2>${esc(pg.bookPage.insideHeading)}</h2><ul>${b.inside.map(i => `<li>${esc(i)}</li>`).join('')}</ul>
<p><a href="${ctx.url('books')}">&larr; ${esc(pg.bookPage.backLink)}</a></p></div></div></section>
${vids.length ? `<section class="band cork"><div class="wrap"><div class="band-head"><p class="label">${esc(pg.bookPage.videosLabel)}</p><h2 class="h-sec">${hl(pg.bookPage.videosHeadline)}</h2></div><div class="grid">${vids.map(v => vcard({ ...v, book: null }, ctx)).join('')}</div></div></section>` : ''}${magnetBand(ctx)}`, { ogType: 'book' });
  });

  add('blog', 'Blog', 'Case notes: short posts on famous mysteries, real documents and how to check a claim.', pageHead(pg.blogPage.label, esc(pg.blogPage.title), pg.blogPage.intro) + `
<section class="band"><div class="wrap"><div class="posts">${posts.map(p => pcard(p, ctx)).join('')}</div></div></section>${magnetBand(ctx)}`);

  posts.forEach(p => add('post-' + p.slug, p.title, p.description, pageHead(p.tag, esc(p.title)) + `
<section class="band"><div class="wrap"><article class="sheet"><p class="meta">${fmtDate(p.date)} · ${esc(pg.blogPost.by)} ${esc(site.author)}</p>
${md(p.body, ctx)}
<div class="endcta"><strong>${esc(pg.blogPost.endBoxTitle)}</strong><span>${esc(pg.blogPost.endBoxText)}</span><a class="btn" href="${ctx.url('free')}">${esc(pg.blogPost.endBoxButton)}</a></div>
<p><a href="${ctx.url('blog')}">&larr; ${esc(pg.blogPost.backLink)}</a></p></article></div></section>`, { ogType: 'article', date: p.date }));

  ['about', 'privacy', 'terms', 'disclaimer', 'affiliate-disclosure', 'cookies', 'refunds'].forEach(slug => {
    const { meta, body } = frontMatter(C('pages/' + slug + '.md'));
    add(slug, meta.title, meta.description, pageHead(meta.label, esc(meta.title)) + `<section class="band"><div class="wrap"><article class="sheet">${md(fill(body), ctx)}</article></div></section>`);
  });

  const ca = site.contactForm.action, soc = Object.entries(site.social).filter(([, u]) => u);
  add('contact', 'Contact', 'Send a tip, a correction or a question to Conspiracy Theories Explained.', pageHead(pg.contactPage.label, esc(pg.contactPage.title), pg.contactPage.intro) + `
<section class="band"><div class="wrap"><div class="sheet">
<form class="cform" data-form="contact" method="post"${ca ? ` action="${esc(ca)}"` : ''}>
<label for="c-name">${esc(pg.contactPage.nameLabel)}<input id="c-name" name="name" autocomplete="name" required></label>
<label for="c-email">${esc(pg.contactPage.emailLabel)}<input id="c-email" type="email" name="email" autocomplete="email" required></label>
<label for="c-msg">${esc(pg.contactPage.messageLabel)}<textarea id="c-msg" name="message" rows="6" required></textarea></label>
<div class="hp" aria-hidden="true"><label>Leave this empty<input name="website" tabindex="-1" autocomplete="off"></label></div>
<button class="btn" type="submit">${esc(pg.contactPage.sendButton)}</button><p class="form-msg" role="status" hidden></p></form>
<hr><h2>${esc(pg.contactPage.otherWaysHeading)}</h2><p>${esc(pg.contactPage.emailWord)} ${esc(site.contactEmail)}</p>
${soc.length ? `<ul>${soc.map(([k, u]) => `<li><a href="${esc(u)}" rel="noopener">${{ youtube: 'YouTube', x: 'X', tiktok: 'TikTok', instagram: 'Instagram' }[k] || k}</a></li>`).join('')}</ul>` : ''}
<p>${esc(pg.contactPage.mistakeNote)}</p></div></div></section>`);

  add('free', 'Free Downloads', 'Free one-page tools for checking any claim: the Evidence Checklist and the Declassified Reading List.', pageHead(pg.freePage.label, esc(pg.freePage.title), pg.freePage.intro) + `
<section class="band cork"><div class="wrap"><div class="mgrid">${magnets.map(m => `<article class="mcard"><span class="pin c"></span><span class="k">${esc(m.kicker)}</span><h3>${esc(m.title)}</h3><p>${esc(m.desc)}</p></article>`).join('')}
<div class="mcard"><span class="pin c"></span><span class="k">${esc(pg.freePage.formLabel)}</span><h3>${esc(pg.freePage.formTitle)}</h3>${signup(ctx, esc(pg.freePage.formButton))}</div></div></div></section>`);

  add('thanks', 'Thank You', 'Your free downloads.', pageHead(pg.thanksPage.label, esc(pg.thanksPage.title)) + `
<section class="band"><div class="wrap"><div class="sheet"><p>${esc(pg.thanksPage.text)}</p>
<ul>${magnets.map(m => `<li>${ctx.preview ? `<strong>${esc(m.title)}</strong> (the download link works on the live site)` : `<a href="${ctx.asset('downloads/' + m.file)}">${esc(m.title)} (PDF)</a>`}</li>`).join('')}</ul>
<h2>${esc(pg.thanksPage.nextHeading)}</h2><ul><li><a href="${ctx.url('videos')}">${esc(pg.thanksPage.watchLink)}</a></li><li><a href="${ctx.url('books')}">${esc(pg.thanksPage.booksLink)}</a></li>${yt ? `<li><a href="${esc(yt)}" rel="noopener">${esc(home.videos.subscribeButton)}</a></li>` : ''}</ul></div></div></section>`, { noindex: true });
  return P;
}

// ---------- page shell ----------
function shell(ctx, inner, current) {
  const nav = ['videos', 'books', 'blog', 'about'].map(k => [k, esc(home.menu[k])]);
  const soc = Object.entries(site.social).filter(([, u]) => u), names = { youtube: 'YouTube', x: 'X', tiktok: 'TikTok', instagram: 'Instagram' };
  return `<a class="skip" href="#main">Skip to content</a>${DEFS}
<header class="top"><div class="wrap"><a class="brand" href="${ctx.url('home')}" aria-label="${esc(site.name)} home">${SEAL}<b>Conspiracy Theories<br><span>Explained</span></b></a>
<nav class="nav" aria-label="Main">${nav.map(([s, t]) => `<a href="${ctx.url(s)}"${current === s ? ' aria-current="page"' : ''}>${t}</a>`).join('')}<a class="btn small" href="${ctx.url('free')}">${esc(home.menu.freeButton)}</a></nav></div></header>
<main id="main">${inner}</main>
<footer class="foot"><div class="wrap"><div class="cols">
<div><a class="brand oneline" href="${ctx.url('home')}">${SEAL}<b>Conspiracy Theories <span>Explained</span></b></a><p class="tagline">${TAG}</p><p>${esc(home.footer.line)}</p></div>
<div><h2>Explore</h2><ul>${[['videos', 'Videos'], ['books', 'Books'], ['blog', 'Blog'], ['free', 'Free downloads'], ['about', 'About'], ['contact', 'Contact']].map(([s, t]) => `<li><a href="${ctx.url(s)}">${t}</a></li>`).join('')}</ul></div>
<div><h2>Legal</h2><ul>${[['privacy', 'Privacy Policy'], ['terms', 'Terms of Use'], ['disclaimer', 'Disclaimer'], ['affiliate-disclosure', 'Affiliate Disclosure'], ['cookies', 'Cookie Policy'], ['refunds', 'Refund Policy']].map(([s, t]) => `<li><a href="${ctx.url(s)}">${t}</a></li>`).join('')}</ul></div>
<div><h2>Follow</h2><ul>${soc.map(([k, u]) => `<li><a href="${esc(u)}" rel="noopener">${names[k] || k}</a></li>`).join('')}</ul></div>
</div><p class="legal"><span>&copy; ${new Date().getFullYear()} ${esc(site.company)}. All rights reserved.</span><span>${esc(home.footer.note)}</span></p></div></footer>`;
}

// ---------- write the real site ----------
const css = read(path.join(ROOT, 'assets/style.css')), js = read(path.join(ROOT, 'assets/site.js'));
const write = (p, s) => { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, s); };
const copyDir = (from, to, filter) => { if (!fs.existsSync(from)) return; fs.mkdirSync(to, { recursive: true }); fs.readdirSync(from).forEach(f => { if (!filter || filter(f)) fs.copyFileSync(path.join(from, f), path.join(to, f)); }); };
const DIST = path.join(ROOT, 'dist');
fs.rmSync(DIST, { recursive: true, force: true });

const siteCtx = { preview: false, url: s => PATHS[s] || '/', asset: p => '/' + p };
uid = 0;
const sitePages = pages(siteCtx);
const hasOg = exists('images/og.png');
const head = (p) => {
  const title = p.title ? `${p.title} | ${site.name}` : `${site.name} | The Theory, The Evidence, You Decide`, canon = site.domain + (PATHS[p.slug] || '/');
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title><meta name="description" content="${esc(p.desc)}">
${p.noindex ? '<meta name="robots" content="noindex">' : `<link rel="canonical" href="${canon}">`}
<meta property="og:site_name" content="${esc(site.name)}"><meta property="og:title" content="${esc(p.title || site.name)}"><meta property="og:description" content="${esc(p.desc)}"><meta property="og:type" content="${p.ogType || 'website'}"><meta property="og:url" content="${canon}">
${hasOg ? `<meta property="og:image" content="${site.domain}/images/og.png"><meta name="twitter:card" content="summary_large_image">` : ''}
<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml"><link rel="alternate" type="application/rss+xml" title="${esc(site.name)} Blog" href="/feed.xml">
<link rel="preload" href="/assets/fonts/anton-latin-400-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/assets/style.css">${site.headSnippet || ''}
</head><body>`;
};
sitePages.forEach(p => write(path.join(DIST, PATHS[p.slug], 'index.html'), head(p) + shell(siteCtx, p.body, p.slug) + `<script src="/assets/site.js" defer></script></body></html>`));
write(path.join(DIST, '404.html'), head({ slug: 'home', title: 'Page Not Found', desc: 'This page is missing.', noindex: true }) + shell(siteCtx, pageHead(pg.notFoundPage.label, esc(pg.notFoundPage.title), pg.notFoundPage.text) + `<section class="band"><div class="wrap"><a class="btn" href="/">${esc(pg.notFoundPage.button)}</a></div></section>`) + `<script src="/assets/site.js" defer></script></body></html>`);
write(path.join(DIST, 'assets/style.css'), css.replace(/__FONTS__/g, '/assets/fonts'));
write(path.join(DIST, 'assets/site.js'), js);
write(path.join(DIST, 'assets/favicon.svg'), SEAL.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ').replace(' aria-hidden="true"', ''));
copyDir(path.join(ROOT, 'assets/fonts'), path.join(DIST, 'assets/fonts'));
copyDir(path.join(ROOT, 'images'), path.join(DIST, 'images'), f => !/\.(md|txt)$/.test(f));
copyDir(path.join(ROOT, 'downloads'), path.join(DIST, 'downloads'), f => f.endsWith('.pdf'));
write(path.join(DIST, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${site.domain}/sitemap.xml\n`);
write(path.join(DIST, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` + sitePages.filter(p => !p.noindex).map(p => `<url><loc>${site.domain}${PATHS[p.slug]}</loc>${p.date ? `<lastmod>${p.date}</lastmod>` : ''}</url>`).join('\n') + `\n</urlset>\n`);
write(path.join(DIST, 'feed.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0"><channel><title>${esc(site.name)} Blog</title><link>${site.domain}/blog/</link><description>${esc(site.description)}</description>\n` + posts.map(p => `<item><title>${esc(p.title)}</title><link>${site.domain}${PATHS['post-' + p.slug]}</link><guid>${site.domain}${PATHS['post-' + p.slug]}</guid><pubDate>${new Date(p.date + 'T12:00:00Z').toUTCString()}</pubDate><description>${esc(p.description)}</description></item>`).join('\n') + `\n</channel></rss>\n`);

// ---------- write the one-file preview + the guide ----------
const PV = path.join(ROOT, 'preview');
fs.rmSync(PV, { recursive: true, force: true });
const pvCtx = { preview: true, url: s => '#' + s, asset: p => p };
uid = 1000;
const guideMd = exists('GO-LIVE-GUIDE.md') ? read(path.join(ROOT, 'GO-LIVE-GUIDE.md')) : '';
const guideHtml = md(guideMd, { url: s => '#' + s });
const tableCss = `.tablewrap{overflow-x:auto}.sheet table{border-collapse:collapse;width:100%;font-size:1rem}.sheet th,.sheet td{border:1px solid #8f846c;padding:.45rem .6rem;text-align:left;vertical-align:top}.sheet th{font-family:var(--ui);text-transform:uppercase;letter-spacing:.06em;font-size:.85rem;background:#ddd0b0}.sheet code{font-family:"Courier New",monospace;background:#ddd0b0;padding:0 .25em}`;
const pvPages = pages(pvCtx);
if (guideMd) pvPages.push({ slug: 'guide', body: pageHead('FOR YOUR EYES ONLY', 'Go-Live Guide', 'How to put this site on ConspiracyTheoriesExplained.com. This page is only in the preview. Visitors never see it.') + `<section class="band"><div class="wrap"><article class="sheet">${guideHtml}</article></div></section>` });
write(path.join(PV, 'index.html'), `<!DOCTYPE html>
<html lang="en" data-preview><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Conspiracy Theories Explained Website</title>
<style>${css.replace(/__FONTS__/g, 'fonts')}${tableCss}</style></head><body>
<div class="pvbar"><span>Preview of your website. Every page and button works. Videos and forms switch on when it goes live.</span>${guideMd ? '<a href="#guide">Open the Go-Live Guide</a>' : ''}</div>
${shell(pvCtx, pvPages.map(p => `<div class="pv" id="pv-${p.slug}"${p.slug === 'home' ? '' : ' hidden'}>${p.body}</div>`).join('\n'), null)}
<script>${js}</script></body></html>`);
copyDir(path.join(ROOT, 'assets/fonts'), path.join(PV, 'fonts'));
copyDir(path.join(ROOT, 'images'), path.join(PV, 'images'), f => /^cover-.*\.(jpg|jpeg|png|webp)$/i.test(f));
if (guideMd) write(path.join(ROOT, 'GO-LIVE-GUIDE.html'), `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Go-Live Guide</title><style>${css.replace(/__FONTS__/g, 'assets/fonts')}${tableCss}</style></head><body>${pageHead('CONSPIRACY THEORIES EXPLAINED', 'Go-Live Guide')}<section class="band"><div class="wrap"><article class="sheet">${guideHtml}</article></div></section></body></html>`);

console.log(`Built ${sitePages.length + 1} pages into dist/  |  preview/index.html  |  ${posts.length} posts, ${books.length} books, ${videos.length} videos`);
