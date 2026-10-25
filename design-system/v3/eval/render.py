#!/usr/bin/env python3
"""Merge eval/results-static.json and eval/results-browser.json into eval/results.md and eval/results.json.
Run from design-systems/v3/. Does not touch index.html (that is the docs site)."""
import json, pathlib, datetime, html
ROOT = pathlib.Path(__file__).resolve().parent.parent
SYSTEMS = [
 ("v3","Design system v3","One system for the whole site, built from the Claude Fable 5.1 base with pieces from Astra, Kimi K3 and Google Stitch."),
]
def load(name):
    p = ROOT / "eval" / name
    if not p.exists(): return None
    d = json.loads(p.read_text())
    return json.loads(d) if isinstance(d, str) else d
static = load("results-static.json") or []
browser = load("results-browser.json") or []
smap = {r["slug"]: r for r in static}; bmap = {r["slug"]: r for r in browser}
rows = []
for slug, name, _ in SYSTEMS:
    s = smap.get(slug); b = bmap.get(slug)
    row = {"slug": slug, "name": name}
    row["static"] = f"{s['passed']}/{s['total']}" if s else "not run"
    row["static_fails"] = [f"{c['page']}: {c['check']} {c['detail']}".strip() for c in (s["checks"] if s else []) if not c["pass"]]
    if b:
        ov = [f"{p}@{w}" for p, ws in b["pages"].items() for w, v in ws.items() if v.get("overflow")]
        nc = [f"{p}@{w}" for p, ws in b["pages"].items() for w, v in ws.items() if int(w) >= 1440 and v.get("centered") is False]
        row["overflow"] = "none" if not ov else ", ".join(ov)
        row["centered"] = "yes" if not nc else "no: " + ", ".join(nc)
        t = b.get("theme", {}); row["theme"] = "pass" if t and all(t.get(k) for k in ("defaultLight","clickDark","persists","systemRemovesAttr","systemFollowsDark")) else "fail: " + ", ".join(k for k in ("defaultLight","clickDark","persists","systemRemovesAttr","systemFollowsDark") if not t.get(k))
        cf = [f"{th}: {c['pair']} {c['ratio']}" for th, cs in b.get("contrast", {}).items() for c in cs if not c["pass"]]
        ds = b.get("darkStory", {}); dsf = ds.get("fails", []) if isinstance(ds, dict) else []
        dsn = ds.get("checked") if isinstance(ds, dict) else None
        ds_text = ("dark frames pass (%s nodes)" % dsn) if (dsn and not dsf) else ("dark frames: %d failures" % len(dsf) if dsf else "dark frames not run")
        row["contrast"] = ("all pairs pass AA; " + ds_text) if not cf else "; ".join(cf) + "; " + ds_text
        bd = b.get("bands", {})
        if isinstance(bd, dict) and bd.get("widths"):
            cnt = bd["widths"].get("1440", bd["widths"].get(1440, {})).get("count", 0)
            narrow = [f"{w}: {len(v.get('narrow', []))} not full bleed" for w, v in bd["widths"].items() if v.get("narrow")]
            thb = [f"{t}: {len([c for c in v.get('contrast', []) if not c.get('pass')])} contrast failures" for t, v in bd.get("themes", {}).items() if any(not c.get("pass") for c in v.get("contrast", []))]
            few = [f"{t}: {v.get('distinct')} grounds" for t, v in bd.get("themes", {}).items() if (v.get("distinct") or 0) < 3]
            probs = narrow + thb + few
            row["bands"] = (f"{cnt} bands, full bleed, distinct grounds, text passes" if cnt and not probs else (f"{cnt} bands; " + "; ".join(probs) if cnt else "none"))
        else:
            row["bands"] = "not run" if not isinstance(bd, dict) or "error" in bd else "none"
        n = b.get("nojs", {}); row["nojs"] = "pass" if n and all(n.get(k) for k in ("summary","facts","firstSection","nav")) else "fail: " + ", ".join(k for k in ("summary","facts","firstSection","nav") if not n.get(k))
    else:
        for k in ("overflow","centered","theme","contrast","nojs","bands"): row[k] = "not run"
    rows.append(row)
(ROOT / "eval" / "results.json").write_text(json.dumps(rows, indent=1))
stamp = datetime.date.today().isoformat()
md = ["# Eval results, " + stamp, "", "Gates from SPEC.md section 10. Static checks run on the files; browser checks run in Chromium via playwright-cli at 390, 768, 1024, 1440, 1920 and 2560 px.", "",
      "| System | Static checks | Overflow | Centered at 1440+ | Theme control | Contrast AA | Bands | No JS |", "|---|---|---|---|---|---|---|---|"]
for r in rows: md.append(f"| {r['name']} | {r['static']} | {r['overflow']} | {r['centered']} | {r['theme']} | {r['contrast']} | {r['bands']} | {r['nojs']} |")
md.append("")
for r in rows:
    if r["static_fails"]:
        md.append(f"## {r['name']}: static failures"); md += [f"- {f}" for f in r["static_fails"]]; md.append("")
(ROOT / "eval" / "results.md").write_text("\n".join(md))
print("\n".join(md))
