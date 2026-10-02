# Metstrade 2026 business profiles

Static HTML, CSS and JavaScript. No framework, external CDN or build dependency.

Run a local preview from this directory:

```sh
python3 -m http.server 8765 --bind 127.0.0.1
```

Open http://127.0.0.1:8765. The site can also be opened directly from `index.html`.

The hero and resources follow Figma Frames 2912 and 2914. The eight businesses shuffle on every refresh. Desktop uses a pinned scroll deck that peels left. Mobile uses a looping swipe deck: intro, eight shuffled business cards, resources, then intro again, with no vertical scrolling. Copy scales to fit smaller phone screens. Next/previous buttons and left/right arrow keys also navigate. Reduced motion removes transitions on mobile and uses the regular card list on desktop.

All text uses `#2B160E`. Cards follow the updated DockPro and Stella Marine references, with inset images, padded frames and website buttons inside the image's bottom-right corner. Mobile shows the business information first, then the image with its URL button, in the same looping swipe deck. Copy scales only when needed to fit the frame. Website buttons stay visible throughout card transitions. Mouse users keep the normal cursor with the small yellow dot following smoothly, offset 20 pixels from the pointer so it stays clear of the cursor. Touch input keeps the normal swipe controls. The shared `cursor.js` also runs on the delegate map page.

## Copy and media

- Edit `profiles.json`, then run `python3 build.py` to regenerate `index.html`.
- `template.html` holds the hero and final resources content.
- Images are in `assets/images/`, named for each business.
- To use a video, replace a card's `<img>` in `index.html` (or change `build.py`) with `<video muted loop playsinline preload="metadata" poster="assets/images/dockpro.webp"><source src="assets/videos/dockpro.mp4" type="video/mp4"></video>`. The script plays only the active card’s video. Keep the same `.card-media` wrapper.
- The footer follows the updated Frame 2914 reference: closing copy, a visible “Resources →” heading and three yellow buttons, with Invest Gold Coast / Metstrade 2026 at the bottom.
- The delegate map button opens `map.html`. Its downloadable, self-contained SVG highlights the two Australian flags in Halls 3 and 7. The source floorplan's pixels, hall outlines, stands and labels are preserved. Run `python3 build_map.py` to regenerate the SVG from the bundled source image and fonts.
- PDF version and Invest Gold Coast remain placeholders. Give their anchors an `href`, then remove `aria-disabled="true"` and the `resource-placeholder` class when the URLs are supplied.
- Fonts are the existing GoldCoaster Display and Text fonts from this computer.

## Scroll feel

In `site.js`, `stageHeight * 0.95` sets distance per card, `0.30` sets the reading pause, `62` sets the follow-through in milliseconds, and `-9` sets the departing card’s tilt in degrees. Scroll progress is recalculated on resize and restores on browser back/forward navigation.

## GitHub Pages

Unzip the website package and upload its contents so `index.html`, `map.html` and `assets/` are at the root of your GitHub Pages branch. All asset paths are relative; there is no build step. `.nojekyll` is included. The CSS and script URLs include a version tag so browsers fetch the updated footer and cursor.
