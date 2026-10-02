"""Build a portable branded SVG, preserving the official floorplan pixels."""
from base64 import b64encode
from pathlib import Path

ROOT = Path(__file__).resolve().parent
ASSETS = ROOT / "assets"

def data(path):
    return b64encode(path.read_bytes()).decode("ascii")

floorplan = data(ASSETS / "maps/floorplan-source.png")
display = data(ASSETS / "fonts/GoldCoasterDisplay-Black.ttf")
regular = data(ASSETS / "fonts/GoldCoasterText-Regular.ttf")
bold = data(ASSETS / "fonts/GoldCoasterText-Bold.ttf")
heading = '''  <text class="display" x="140" y="164" font-size="116">Metstrade 2026</text>
  <text x="140" y="252" font-size="48">Find Australia in Halls 3 &amp; 7</text>'''

svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="2800" height="3160" viewBox="0 0 2800 3160" role="img" aria-labelledby="title description">
  <title id="title">Metstrade 2026 — Australia in Halls 3 and 7</title>
  <desc id="description">The official provisional floorplan with yellow callouts around Australia's country flags beside Hall 3 and above Hall 7. Hall geometry, stands, country markers and original labels are unchanged.</desc>
  <defs>
    <clipPath id="map-panel"><rect x="60" y="345" width="2680" height="2585" rx="56"/></clipPath>
    <linearGradient id="brand" x2="0" y2="1">
      <stop stop-color="#D8F5FC"/><stop offset=".52" stop-color="#FFD7C1"/><stop offset="1" stop-color="#F4BCEE"/>
    </linearGradient>
    <style>
      @font-face {{font-family:GCDisplay;src:url(data:font/ttf;base64,{display}) format('truetype');font-weight:900}}
      @font-face {{font-family:GCText;src:url(data:font/ttf;base64,{regular}) format('truetype');font-weight:400}}
      @font-face {{font-family:GCText;src:url(data:font/ttf;base64,{bold}) format('truetype');font-weight:700}}
      text {{fill:#2B160E;font-family:GCText,Arial,sans-serif}}
      .display {{font-family:GCDisplay,Arial,sans-serif;font-weight:900}}
      .callout {{font-weight:700;font-size:40px}}
    </style>
  </defs>
  <rect width="2800" height="3160" fill="url(#brand)"/>
{heading}
  <rect x="60" y="345" width="2680" height="2585" rx="56" fill="#FFF"/>
  <image x="60" y="365" width="2679" height="2523" clip-path="url(#map-panel)" href="data:image/png;base64,{floorplan}"/>

  <!-- Coordinates refer to the original 2679 × 2523 floorplan, without resizing. -->
  <g transform="translate(60 365)">
    <g fill="none" stroke="#FCFF6E" stroke-width="14" stroke-linecap="round" stroke-linejoin="round">
      <rect x="1466" y="927" width="85" height="77" rx="14"/>
      <path d="M 1390 852 H 1508 V 921"/>
      <rect x="1909" y="561" width="88" height="78" rx="14"/>
      <path d="M 1953 455 V 555"/>
    </g>
    <rect x="1010" y="807" width="380" height="90" rx="45" fill="#FCFF6E"/>
    <text class="callout" x="1200" y="866" text-anchor="middle">Australia · Hall 3</text>
    <rect x="1763" y="365" width="380" height="90" rx="45" fill="#FCFF6E"/>
    <text class="callout" x="1953" y="424" text-anchor="middle">Australia · Hall 7</text>
  </g>

  <text x="140" y="3025" font-size="30">Invest Gold Coast · Metstrade 2026</text>
  <text x="140" y="3080" font-size="26">Source: RAI Amsterdam / Metstrade · Provisional floorplan — subject to change.</text>
</svg>'''

output = ASSETS / "maps/metstrade-australia-2026.svg"
output.write_text(svg)
# The webpage supplies its own heading. The downloadable/printed version
# keeps the standalone heading, while the web preview starts at the map panel.
web_svg = svg.replace('height="3160" viewBox="0 0 2800 3160"',
                      'height="2835" viewBox="0 325 2800 2835"', 1).replace(heading, '')
web_output = ASSETS / "maps/metstrade-australia-2026-web.svg"
web_output.write_text(web_svg)
print(f"Built {output.name} and {web_output.name} with the original floorplan embedded.")
