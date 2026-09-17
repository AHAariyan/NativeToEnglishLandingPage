# NativeToEnglish landing page

This is a standalone, public marketing page. It deliberately contains no application code, API keys, user data, or backend configuration.

## Files

| File | Purpose |
|---|---|
| `index.html` | The whole page. No build step, no framework. |
| `styles.css` | Design tokens and layout. Light and dark palettes are both defined here. |
| `script.js` | Theme toggle, sticky header, scroll reveals, and the interactive hero demo. |
| `logo.png` | Source logo, full resolution. Not loaded by the page — keep it as the master for regenerating the assets below. |
| `logo-mark.png` | 106×96 header and footer mark, served at 34px so it stays crisp on 3× screens. |
| `favicon-32.png` | Browser tab icon. |
| `apple-touch-icon.png` | 180×180 iOS home-screen icon, on a paper-coloured plate (iOS does not handle transparency). |
| `og-image.png` | 1200×630 social preview card referenced by the Open Graph and Twitter tags. |

The page is plain HTML, CSS, and JavaScript on purpose: GitHub Pages serves it exactly as committed, and the whole thing works with no network calls beyond Google Fonts.

## Preview locally

```sh
python3 -m http.server 8099
```

Then open `http://localhost:8099/`.

## Publish with GitHub Pages

In the GitHub repository, open **Settings → Pages** and set the publishing source to **Deploy from a branch**, then choose `main` and the `/(root)` folder.

The published address will be:

`https://ahaariyan.github.io/NativeToEnglishLandingPage/`

## Before publishing

- The **Request an invite** button opens the visitor's own mail app addressed to `abdulhady.aariyan@gmail.com`, with a subject and a short prompt pre-filled. Change it in `index.html` if the address changes.
- If the page moves to a custom domain, update the `og:url`, `og:image`, `twitter:image`, and `canonical` URLs in the `<head>`.

## Notes on behaviour

- **Theme.** The page follows the visitor's system setting. The toggle in the header overrides it and stores the choice in `localStorage` under `n2e-theme`; the inline script in `<head>` applies it before first paint so the theme never flashes.
- **Hero demo.** On first view the Banglish draft types itself and resolves into English. The Native / English / Formal / Academic pills are real controls—they swap the rewrite and are keyboard navigable with the arrow keys. The sample rewrites live in `REWRITES` in `script.js`.
- **Reduced motion.** With `prefers-reduced-motion: reduce`, the typing, reveals, and transitions are all skipped and the demo renders in its finished state.
- **Bangla.** The Native rewrite is marked `lang="bn"` and set in Noto Sans Bengali.

## Brand colours

Sampled directly from `logo.png` and contrast-checked, so every pairing below meets WCAG AA.

| Token | Light | Dark | Used for |
|---|---|---|---|
| `--blue` | `#004ece` | `#5cb0ff` | Primary buttons, links, headline accent, eyebrows |
| `--blue-deep` | `#003da6` | `#8ac6ff` | Button hover |
| `--blue-wash` | `#e6efff` | `#10233d` | Tinted fills in the mockups |
| `--mint` / `--mint-ink` | `#dff5ee` / `#0a5f4c` | `#0f2f28` / `#5fe0b4` | The rewrite result card |
| `--accent` | `#0bb3bd` | `#4fd6ff` | Small cyan details |
| `--brand-gradient` | `#004ece → #04faf7 → #1cf0a0` | same | The rule above the statement panel |

The logo runs deep blue → cyan → teal, which maps onto the page's existing structure: blue is what you *do* (buttons, actions), green is what you *get back* (the result card).

To regenerate the image assets after replacing `logo.png`, resize with Lanczos to the sizes in the file table above.
