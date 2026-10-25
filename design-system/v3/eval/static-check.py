#!/usr/bin/env python3
"""Static quality gates from SPEC.md section 10, run on the files of each system.
Usage: python3 eval/static-check.py   (from design-systems/v3/)
Writes eval/results-static.json. No browser needed."""
import json, re, sys, pathlib, html

ROOT = pathlib.Path(__file__).resolve().parent.parent
SLUGS = ["v3"]
PAGES = ["index.html", "templates/home.html", "templates/post.html", "templates/blog.html"]
TOKENS = ["--color-bg","--color-bg-alt","--color-surface","--color-surface-raised","--color-text","--color-text-muted",
  "--color-text-faint","--color-line","--color-line-strong","--color-accent","--color-accent-hover","--color-on-accent",
  "--color-accent-soft","--color-focus","--color-inverse-bg","--color-inverse-text","--color-topic-aem-ai","--color-topic-aem",
  "--color-topic-agents","--color-topic-work","--color-project-cyan","--color-project-rose","--color-diagram-ground","--font-display","--font-body","--font-mono","--text-display","--text-h1","--text-h2",
  "--text-h3","--text-body-lg","--text-body","--text-small","--text-label","--text-mono","--leading-tight","--leading-body",
  "--tracking-label","--weight-regular","--weight-medium","--weight-bold","--space-1","--space-10","--container-max","--gutter",
  "--measure","--header-height","--radius-sm","--radius-md","--radius-lg","--radius-pill","--border-width","--shadow-1","--shadow-2",
  "--duration-fast","--duration-base","--ease-standard","--z-header"]
COMPONENTS = [".skip-link",".sr-only",".site-header",".wordmark",".nav-toggle",".site-nav",".theme-control",".breadcrumb",".page-head",
  ".kicker",".page-title",".byline",".summary",".btn",".btn--primary",".btn--secondary",".btn--ghost",".btn--sm",".chip",".chip--topic",
  ".chip--format",".chip--status",".card",".card--hub",".card--project",".facts",".table-wrap",".table",".counts",
  ".row-list",".faq",".faq__item",".filter-bar",".pagination",".embed",".embed__fallback",".chapters",".transcript",".author-box",
  ".callout",".cta-band",".site-footer",".icon",".story",".docs-nav",".container",".grid",".stack",".cluster",".prose",
  ".band",".band--alt",".band--tint",".band--inverse",".band--milestone",".divider",".divider__label",
  ".showcase",".frame",".proof-links",".link--repo",".stat",".stat-chips",".chapter-head",".method-line",".timeline",".card--tool",".proof",".panel--inverse",".grid--rules",".card--link"]
SECTIONS = ["overview","color","typography","spacing","layout","shape-elevation","motion","iconography","theming","components",
  "patterns","templates","status","changelog","c-button","c-card","c-facts-table","c-band","c-divider",
  "c-proof","c-panel-inverse","c-showcase","c-frame","c-proof-links","c-stat","c-chapter-head","c-timeline"]
README_HEADINGS = ["What this is","Identity","Files","How to use","Tokens","Components","Theming","Templates","Accessibility",
  "Deviations","Sources","Status"]
PREPAINT = "(function(){var d=document.documentElement;d.classList.add('js');try{var s=localStorage.getItem('jj-theme');"
DASH = re.compile("[\u2013\u2014\u2015\u2212]")

def strip(s): return re.sub(r"<[^>]+>", "", s)

def check_page(slug, rel, text, res):
    p = f"{slug}/{rel}"
    def ok(name, cond, detail=""):
        res["checks"].append({"page": rel, "check": name, "pass": bool(cond), "detail": detail})
    head = text.split("</head>")[0] if "</head>" in text else text[:6000]
    ok("lang=en", 'lang="en"' in text[:400])
    ok("theme default light", 'data-theme-default="light"' in text[:400])
    vp = head.find('name="viewport"'); gt = head.find("googletagmanager.com/gtag/js")
    ok("gtag first after viewport", vp > -1 and gt > vp and "gtag('config', 'G-ZVENE6BXTJ')" in head)
    ok("canonical", 'rel="canonical" href="https://www.jackzhaojin.com/design-systems/v3/' in head)
    ok("robots noindex", 'name="robots" content="noindex"' in head)
    ok("pre-paint snippet verbatim", PREPAINT in head)
    ok("shared theme.js referenced", "shared/theme.js" in head)
    ok("css order tokens>base>components", head.find("tokens.css") < head.find("base.css") < head.find("components.css") if all(x in head for x in ("tokens.css","base.css","components.css")) else False)
    scripts = re.findall(r'<script[^>]*src="([^"]+)"', text)
    bad = [s for s in scripts if s.startswith("http") and "googletagmanager.com" not in s]
    ok("no external scripts except gtag", not bad, ", ".join(bad))
    ok("no tailwind cdn", "cdn.tailwindcss" not in text)
    ok("no material symbols", "Material+Symbols" not in text)
    links = re.findall(r'<link[^>]*rel="stylesheet"[^>]*href="(https?://[^"]+)"', text)
    badf = [l for l in links if not l.startswith("https://fonts.googleapis.com")]
    ok("fonts only from fonts.googleapis.com", not badf, ", ".join(badf))
    ok("skip link", 'class="skip-link"' in text)
    h1s = re.findall(r"<h1[\s>]", text)
    ok("exactly one h1", len(h1s) == 1, f"{len(h1s)} h1")
    levels = [int(m) for m in re.findall(r"<h([1-6])[\s>]", text)]
    jumps = [(a, b) for a, b in zip(levels, levels[1:]) if b > a + 1]
    ok("no skipped heading levels", not jumps, str(jumps[:3]))
    wm = re.search(r'<a class="wordmark"[^>]*>(.*?)</a>', text, re.S)
    wtxt = html.unescape(strip(wm.group(1))).strip() if wm else ""
    ok("wordmark is Jack Jin only", bool(wm) and re.fullmatch(r"Jack Jin[._]?", wtxt) is not None and "<svg" not in wm.group(1) and "<img" not in wm.group(1), repr(wtxt[:40]))
    ok("theme control present", text.count('data-set-theme="') >= 3)
    ok("no href=\"#\"", 'href="#"' not in text)
    imgs = re.findall(r"<img[^>]*>", text)
    noalt = [i for i in imgs if " alt=" not in i]
    ok("img alt", not noalt, f"{len(noalt)} missing")
    ok("decorative svg aria-hidden", all('aria-hidden="true"' in s for s in re.findall(r'<svg class="icon"[^>]*>', text)))
    # internal links resolve
    base = (ROOT / rel).parent
    ids = set(re.findall(r'\sid="([^"]+)"', text))
    missing = []
    scan = re.sub(r"<pre[\s\S]*?</pre>", "", text)
    for href in re.findall(r'href="([^"]+)"', scan):
        if href.startswith(("http", "mailto:", "tel:")): continue
        target, _, frag = href.partition("#")
        target = target.split("?")[0]
        if target:
            tp = (ROOT.parent.parent / target.lstrip("/")).resolve() if target.startswith("/") else (base / target).resolve()
            if tp.is_dir(): tp = tp / "index.html"
            if not tp.exists(): missing.append(href)
        elif frag and frag not in ids: missing.append(href)
    ok("internal links resolve", not missing, ", ".join(missing[:5]))
    if rel == "index.html":
        for sid in SECTIONS: ok(f"docs section #{sid}", f'id="{sid}"' in text)
        ok("dark story frame", 'class="story" data-theme="dark"' in text or ('data-theme="dark"' in text and 'class="story' in text))
        ok("code samples escaped", "&lt;" in text)
    if rel == "templates/blog.html":
        ok("39 post cards", text.count('class="card card--post"') >= 39, str(text.count('class="card card--post"')))
    if rel == "templates/home.html":
        ok("four hub cards", text.count("card--hub") >= 4)
    if rel == "templates/post.html":
        for c in (".facts", "chapters", "transcript", "author-box", "embed__fallback"):
            ok(f"post has {c}", c.strip(".") in text)

def run(slug):
    res = {"slug": slug, "checks": []}
    folder = ROOT
    def ok(name, cond, detail=""): res["checks"].append({"page": "(folder)", "check": name, "pass": bool(cond), "detail": detail})
    for f in ["README.md","index.html","tokens.css","tokens.json","base.css","components.css","templates/home.html","templates/post.html","templates/blog.html"]:
        ok(f"file {f}", (folder / f).exists())
    dashes = []
    for f in folder.rglob("*"):
        if f.is_file() and f.suffix in (".html",".css",".js",".json",".md") and "eval/results" not in str(f) and f.name != "PRODUCT.md":
            t = f.read_text(errors="ignore")
            for i, line in enumerate(t.splitlines(), 1):
                if DASH.search(line): dashes.append(f"{f.relative_to(ROOT)}:{i}")
    ok("no unicode dashes in any file", not dashes, ", ".join(dashes[:5]) + (" ..." if len(dashes) > 5 else ""))
    tk = (folder / "tokens.css").read_text(errors="ignore") if (folder / "tokens.css").exists() else ""
    missing = [t for t in TOKENS if tk.count(t + ":") < 1]
    ok("all semantic tokens defined", not missing, ", ".join(missing[:8]))
    twice = [t for t in TOKENS if t.startswith("--color-") and tk.count(t + ":") < 2]
    ok("color tokens defined for both themes", not twice, ", ".join(twice[:8]))
    ok("theme selector structure", ':root:not([data-theme="light"]):not([data-theme="dark"])' in tk and '[data-theme="dark"]' in tk)
    ok("color-scheme declared", "color-scheme" in tk)
    try:
        tj = json.loads((folder / "tokens.json").read_text())
        ok("tokens.json valid DTCG", "$value" in json.dumps(tj) and "color" in tj and "light" in tj["color"] and "dark" in tj["color"])
    except Exception as e:
        ok("tokens.json valid DTCG", False, str(e)[:80])
    comp = "".join((folder / f).read_text(errors="ignore") for f in ("base.css","components.css","index.html") if (folder / f).exists())
    miss_c = [c for c in COMPONENTS if c not in comp]
    ok("all component classes styled", not miss_c, ", ".join(miss_c[:10]))
    ok("band tint uses color-mix", "color-mix(" in comp and ".band--tint" in comp)
    def band_stats(name):
        t = (folder / "templates" / name).read_text(errors="ignore") if (folder / "templates" / name).exists() else ""
        classes = re.findall(r'class="([^"]*)"', t)
        bands = [c for c in classes if re.search(r'(^|\s)band(\s|$)', c)]
        variants = set(v for c in bands for v in re.findall(r'band--(alt|tint|inverse|milestone)', c))
        return len(bands), variants
    hb, hv = band_stats("home.html"); pb, pv = band_stats("post.html"); bb, bv = band_stats("blog.html")
    ok("home uses five bands across three variants", hb >= 5 and len(hv) >= 3, f"{hb} bands, variants {sorted(hv)}")
    ok("post uses a non-plain band", len(pv) >= 1, f"{pb} bands, variants {sorted(pv)}")
    ok("blog uses a non-plain band", len(bv) >= 1, f"{bb} bands, variants {sorted(bv)}")
    ok("reduced motion respected", "prefers-reduced-motion" in comp)
    ok("focus-visible styled", "focus-visible" in comp)
    ok("no opacity-zero reveal", not re.search(r"\.reveal[^{]*\{[^}]*opacity:\s*0", comp))
    rd = (folder / "README.md").read_text(errors="ignore") if (folder / "README.md").exists() else ""
    pos = [rd.find("## " + h) for h in README_HEADINGS]
    ok("README headings in order", all(p >= 0 for p in pos) and pos == sorted(pos), str([h for h, p in zip(README_HEADINGS, pos) if p < 0]))
    for rel in PAGES:
        fp = folder / rel
        if fp.exists(): check_page(slug, rel, fp.read_text(errors="ignore"), res)
    res["passed"] = sum(1 for c in res["checks"] if c["pass"]); res["total"] = len(res["checks"])
    return res

results = [run(s) for s in SLUGS]
out = ROOT / "eval" / "results-static.json"
out.write_text(json.dumps(results, indent=1))
for r in results:
    fails = [c for c in r["checks"] if not c["pass"]]
    print(f"{r['slug']}: {r['passed']}/{r['total']} passed")
    for c in fails: print(f"   FAIL [{c['page']}] {c['check']} {c['detail']}")
