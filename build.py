"""Regenerate the static HTML after editing profiles.json. Uses the standard library."""
import html
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
profiles = json.loads((ROOT / "profiles.json").read_text())
cards = []
for index, p in enumerate(profiles):
    esc = html.escape
    title = "<br>".join(esc(line) for line in p["title"])
    title_class = "compact" if p.get("compactTitle") else "medium" if len(p["title"]) > 1 or p.get("mediumTitle") else "large"
    phone = "".join(c for c in p["phone"] if c.isdigit() or c == "+")
    cards.append(f'''      <article class="business-card" id="{p['id']}" aria-labelledby="{p['id']}-title" data-index="{index}" data-name="{esc(p['name'])}">
        <div class="card-copy">
          <div class="card-intro">
            <h2 class="card-title {title_class}" id="{p['id']}-title">{title}</h2>
            <p class="description">{esc(p['description'])}</p>
          </div>
          <div class="connections">
            <h3>Target Connections</h3>
            <p>{esc(p['connections'])}</p>
          </div>
          <div class="contact">
            <h3>Contact</h3>
            <address>
              <span>{esc(p['contact'])}</span>
              <span>{esc(p['role'])}</span>
              <a href="mailto:{esc(p['email'])}">{esc(p['email'])}</a>
              <a href="tel:{phone}">{esc(p['phone'])}</a>
            </address>
          </div>
        </div>
        <div class="card-media">
          <img src="assets/images/{p['id']}.webp" alt="{esc(p['alt'])}" width="507" height="353" decoding="async" fetchpriority="{'high' if index == 0 else 'auto'}">
          <a class="website-pill" href="https://{p['website']}" target="_blank" rel="noopener noreferrer" aria-label="Visit {esc(p['name'])} website (opens in a new tab)">{p['website']}</a>
        </div>
      </article>''')

template = (ROOT / "template.html").read_text()
(ROOT / "index.html").write_text(template.replace("<!-- BUSINESS_CARDS -->", "\n".join(cards)))
print(f"Built index.html with {len(cards)} business profiles.")
