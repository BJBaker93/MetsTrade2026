# Metstrade 2026 business profiles

Static HTML, CSS and JavaScript. No framework, external CDN or build dependency.

Run a local preview from this directory:

```sh
python3 -m http.server 8765 --bind 127.0.0.1
```

Open http://127.0.0.1:8765. The site can also be opened directly from `index.html`.

The hero and resources follow Figma Frames 2912 and 2914. The eight businesses shuffle on every refresh. Desktop uses a pinned scroll deck that peels left. Mobile uses a looping swipe deck: intro, eight shuffled business cards, resources, then intro again, with no vertical scrolling. Copy scales to fit smaller phone screens. Next/previous buttons and left/right arrow keys also navigate. Reduced motion removes transitions on mobile and uses the regular card list on desktop.

## Copy and media

- Edit `profiles.json`, then run `python3 build.py` to regenerate `index.html`.
- `template.html` holds the hero and final resources content.
- Images are in `assets/images/`, named for each business.
- To use a video, replace a card's `<img>` in `index.html` (or change `build.py`) with `<video muted loop playsinline preload="metadata" poster="assets/images/dockpro.webp"><source src="assets/videos/dockpro.mp4" type="video/mp4"></video>`. The script plays only the active card’s video. Keep the same `.card-media` wrapper.
- The three yellow footer buttons are intentionally placeholders. Give their anchors an `href`, then remove `aria-disabled="true"` and the `resource-placeholder` class when the URLs are supplied.
- Fonts are the existing GoldCoaster Display and Text fonts from this computer.

## Scroll feel

In `site.js`, `stageHeight * 0.95` sets distance per card, `0.30` sets the reading pause, `62` sets the follow-through in milliseconds, and `-9` sets the departing card’s tilt in degrees. Scroll progress is recalculated on resize and restores on browser back/forward navigation.

## GitHub Pages

Publish the contents of this directory at the root of a GitHub Pages branch, or put it in a repository subdirectory. All asset paths are relative; there is no build step. `.nojekyll` is included.
