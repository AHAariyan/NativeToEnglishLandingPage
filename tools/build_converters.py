# Builds the free converter pages (/<from>-to-<to>/index.html), the /converters/ hub and the
# sitemap from tools/converters.json and tools/examples.json (real answers from the live API,
# fetched by tools/fetch_examples.mjs). Run from the repo root:  python3 tools/build_converters.py
import json, html, os, re, datetime
SITE = "https://nativetoenglish.landing.matrabhed.com"
PLAY = "https://play.google.com/store/apps/details?id=com.nativetoenglish.mobile"
CHROME = "https://chromewebstore.google.com/detail/nativetoenglish/hcifnjfjbeemchhjmhghefoonidcnjdm"
data = json.load(open("tools/converters.json"))
examples = json.load(open("tools/examples.json")) if os.path.exists("tools/examples.json") else {}
analytics = open("tools/analytics-snippet.html").read()
RTL = {"ur", "ar"}
FONT = {"bn": "Noto+Sans+Bengali:wght@400;600", "hi": "Noto+Sans+Devanagari:wght@400;600", "ur": "Noto+Nastaliq+Urdu:wght@400;600", "ar": "Noto+Naskh+Arabic:wght@400;600", "tl": ""}
NAME = {"bn": "Bangla", "hi": "Hindi", "ur": "Urdu", "ar": "Arabic", "tl": "Tagalog"}
e = html.escape

def faqs(p):
    lang = NAME[p["lang"]]
    out_native = p["goal"] == "native"
    return [
        (f"Is this {p['from']} to {p['to']} converter free?", f"Yes. You get 3 free conversions a day here and in the NativeToEnglish apps, up to 1,500 characters each. No sign-up. Pro gives 500 a day."),
        (f"How does it convert {p['from']}?", (f"It reads what you typed in English letters, works out the {lang} words you meant, and writes them in proper {p['to']} script, fixing spelling on the way." if out_native else f"It understands your {p['from']} by meaning, not word by word, and writes natural English that keeps what you meant, your tone and every fact.")),
        ("Can I use it inside other apps?", f"Yes. The NativeToEnglish Android app adds an entry to the long-press menu in any app, and the Chrome extension adds a button to every text box. Type in {p['from']}, tap once, and it is replaced where you wrote it."),
        ("Is my text saved?", "No. Only the text you convert is sent, only when you press the button, and it is not stored or used to train AI."),
    ]

def page(p):
    slug, lang = p["slug"], p["lang"]
    url = f"{SITE}/{slug}/"
    rtl = lang in RTL and p["goal"] == "native"
    out_attrs = f' dir="rtl" lang="{lang}"' if rtl else (f' lang="{lang}"' if p["goal"] == "native" else ' lang="en"')
    font = FONT[lang] if p["goal"] == "native" else ""
    font_link = f'<link href="https://fonts.googleapis.com/css2?family={font}&display=swap" rel="stylesheet" />' if font else ""
    ex = examples.get(slug, [])
    ex_html = "".join(f'''
          <figure class="cv-example">
            <figcaption>{e(p["from"])}</figcaption>
            <p class="cv-ex-in">{e(x["draft"])}</p>
            <figcaption>{e(p["to"])}</figcaption>
            <p class="cv-ex-out"{out_attrs}>{e(x["text"])}</p>
          </figure>''' for x in ex)
    samples = "".join(f'<button type="button" class="cv-chip" data-sample="{e(s)}">{e(s[:38] + ("…" if len(s) > 38 else ""))}</button>' for s in p["samples"])
    others = "".join(f'<li><a href="/{o["slug"]}/">{e(o["from"])} to {e(o["to"])}</a></li>' for o in data["pages"] if o["slug"] != slug)
    faq = faqs(p)
    faq_html = "".join(f"<details class=\"cv-faq\"><summary>{e(q)}</summary><p>{e(a)}</p></details>" for q, a in faq)
    ld = [
        {"@context": "https://schema.org", "@type": "WebApplication", "name": f"{p['from']} to {p['to']} converter", "url": url, "applicationCategory": "UtilitiesApplication", "operatingSystem": "Any", "offers": {"@type": "Offer", "price": "0", "priceCurrency": "USD"}, "publisher": {"@type": "Organization", "name": "NativeToEnglish"}},
        {"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [{"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in faq]},
        {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [{"@type": "ListItem", "position": 1, "name": "NativeToEnglish", "item": f"{SITE}/"}, {"@type": "ListItem", "position": 2, "name": "Converters", "item": f"{SITE}/converters/"}, {"@type": "ListItem", "position": 3, "name": p["h1"], "item": url}]},
    ]
    return f'''<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <title>{e(p["title"])}</title>
    <meta name="description" content="{e(p["description"])}" />
    <link rel="canonical" href="{url}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="NativeToEnglish" />
    <meta property="og:title" content="{e(p["title"])}" />
    <meta property="og:description" content="{e(p["description"])}" />
    <meta property="og:url" content="{url}" />
    <meta property="og:image" content="{SITE}/og-image.png" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="theme-color" content="#fbfaf7" media="(prefers-color-scheme: light)" />
    <meta name="theme-color" content="#0d1317" media="(prefers-color-scheme: dark)" />
    <link rel="icon" href="/favicon-32.png" type="image/png" sizes="32x32" />
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400..700&family=Newsreader:ital,opsz,wght@0,6..72,400..600;1,6..72,400..600&display=swap" rel="stylesheet" />
    {font_link}
    <link rel="stylesheet" href="/styles.css" />
    <link rel="stylesheet" href="/converter.css" />
    <script>try {{ var t = localStorage.getItem("n2e-theme"); if (t === "light" || t === "dark") document.documentElement.dataset.theme = t; }} catch (e) {{}}</script>
    <script type="application/ld+json">{json.dumps(ld, ensure_ascii=False)}</script>
  </head>
  <body>
    <a class="skip-link" href="#main">Skip to content</a>
    <header class="site-header">
      <div class="shell header-inner">
        <a class="brand" href="/" aria-label="NativeToEnglish home"><img class="brand-mark" src="/logo-mark.png" alt="" width="106" height="96" decoding="async" /><span class="brand-name">NativeToEnglish</span></a>
        <nav class="header-nav" aria-label="Main navigation"><a class="nav-link" href="/converters/">All converters</a></nav>
      </div>
    </header>
    <main id="main" class="shell cv">
      <nav class="cv-crumbs" aria-label="Breadcrumb"><a href="/">NativeToEnglish</a> › <a href="/converters/">Converters</a> › {e(p["h1"])}</nav>
      <h1 class="cv-h1">{e(p["h1"])} <span>converter</span></h1>
      <p class="cv-lead">{e(p["lead"])}</p>
      <form id="converter" class="cv-card" data-api="{data["api"]}" data-page="{slug}" data-goal="{p["goal"]}" data-lang="{lang}">
        <label class="cv-label" for="cv-input">Type in {e(p["from"])}</label>
        <textarea id="cv-input" rows="4" maxlength="1500" placeholder="{e(p["placeholder"])}" spellcheck="false"></textarea>
        <div class="cv-row"><div class="cv-chips" aria-label="Try an example">{samples}</div><span class="cv-count" id="converter-count"></span></div>
        <button class="button button-primary cv-go" type="submit">{e(p["button"])}</button>
        <div class="cv-result" id="converter-result" hidden>
          <div class="cv-label">{e(p["to"])}</div>
          <p class="cv-output" id="converter-output"{out_attrs}></p>
          <button class="button button-quiet button-sm" type="button" id="converter-copy">Copy</button>
        </div>
        <p class="cv-note" id="converter-note" role="status" hidden></p>
        <p class="cv-free">Free: 3 conversions a day, up to 1,500 characters. No sign-up. Your text is not stored.</p>
      </form>
      <section class="cv-apps" aria-labelledby="apps-h">
        <h2 id="apps-h">Do it right inside your apps</h2>
        <p>No copying back and forth: type {e(p["from"])} in any app, tap NativeToEnglish, and your text is replaced where you wrote it.</p>
        <div class="hero-actions">
          <a class="button button-primary" href="{PLAY}" target="_blank" rel="noopener" data-cta="play">Get it on Google Play</a>
          <a class="button button-quiet" href="{CHROME}" target="_blank" rel="noopener" data-cta="chrome">Add to Chrome</a>
        </div>
      </section>
      {('<section class="cv-examples" aria-labelledby="ex-h"><h2 id="ex-h">Real examples</h2><div class="cv-ex-grid">' + ex_html + '</div></section>') if ex else ''}
      <section aria-labelledby="faq-h"><h2 id="faq-h">Questions</h2>{faq_html}</section>
      <section aria-labelledby="more-h"><h2 id="more-h">More converters</h2><ul class="cv-more">{others}</ul></section>
    </main>
    <footer class="shell"><a class="brand" href="/"><img class="brand-mark" src="/logo-mark.png" alt="" width="106" height="96" decoding="async" /><span class="brand-name">NativeToEnglish</span></a><p>Write naturally. Communicate clearly.</p></footer>
    <script src="/converter.js?v=1" defer></script>
{analytics}  </body>
</html>
'''

def hub():
    items = "".join(f'<li><a class="cv-hub-card" href="/{p["slug"]}/"><b>{e(p["from"])} to {e(p["to"])}</b><span>{e(p["lead"])}</span></a></li>' for p in data["pages"])
    t = "Free Banglish, Hinglish, Roman Urdu & Taglish Converters"
    d = "Free online converters: Banglish to Bangla or English, Hinglish to Hindi or English, Roman Urdu to Urdu or English, Franco Arabic to Arabic, Taglish to English."
    return f'''<!doctype html>
<html lang="en"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>{e(t)}</title><meta name="description" content="{e(d)}" /><link rel="canonical" href="{SITE}/converters/" />
<meta property="og:title" content="{e(t)}" /><meta property="og:description" content="{e(d)}" /><meta property="og:image" content="{SITE}/og-image.png" />
<link rel="icon" href="/favicon-32.png" type="image/png" sizes="32x32" />
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400..700&family=Newsreader:ital,opsz,wght@0,6..72,400..600;1,6..72,400..600&display=swap" rel="stylesheet" />
<link rel="stylesheet" href="/styles.css" /><link rel="stylesheet" href="/converter.css" />
<script>try {{ var t = localStorage.getItem("n2e-theme"); if (t === "light" || t === "dark") document.documentElement.dataset.theme = t; }} catch (e) {{}}</script></head>
<body><header class="site-header"><div class="shell header-inner"><a class="brand" href="/"><img class="brand-mark" src="/logo-mark.png" alt="" width="106" height="96" /><span class="brand-name">NativeToEnglish</span></a></div></header>
<main id="main" class="shell cv"><h1 class="cv-h1">Free converters</h1><p class="cv-lead">Type the way you text. Get proper English or your own script.</p><ul class="cv-hub">{items}</ul></main>
<footer class="shell"><p>Write naturally. Communicate clearly.</p></footer>
{analytics}</body></html>
'''

for p in data["pages"]:
    assert len(p["title"]) <= 60 and len(p["description"]) <= 155, p["slug"]
    os.makedirs(p["slug"], exist_ok=True)
    open(f'{p["slug"]}/index.html', "w").write(page(p))
os.makedirs("converters", exist_ok=True)
open("converters/index.html", "w").write(hub())
today = datetime.date.today().isoformat()
urls = [f"{SITE}/", f"{SITE}/converters/"] + [f'{SITE}/{p["slug"]}/' for p in data["pages"]]
open("sitemap.xml", "w").write('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + "".join(f"  <url><loc>{u}</loc><lastmod>{today}</lastmod></url>\n" for u in urls) + "</urlset>\n")
print("built", len(data["pages"]), "pages; examples for", len(examples), "pages")
