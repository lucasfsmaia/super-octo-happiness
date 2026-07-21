# Hypera Pharma — Design System

A documented design system for **Hypera Pharma**, one of Brazil's largest pharmaceutical
companies. The aesthetic is clean, corporate and healthcare-forward: lots of white space,
institutional blue as the color of trust, a cyan accent, soft 8px rounding and the **Asap**
typeface. The feeling to aim for: trustworthy, accessible, professional, healthy.

> ⚠️ All logos, brand wordmarks and imagery belong to Hypera Pharma and are used here only as
> visual reference. For production, replace them with properly licensed assets.

## Sources used to build this system
- **`uploads/Template HYPERA.pptx`** — official Hypera deck template. Provided the Hypera Pharma
  logo (color + white), the blue DNA/molecule cover backgrounds, the section gradients, and the
  slide layouts (cover, section divider, two-column content, ranking table). Extracted media lives
  in `uploads/pptx_media/`; the curated assets are in `assets/`.
- **Brand token spec** — colors, type scale, radii and spacing were supplied directly and are the
  source of truth (see `tokens/`).
- Reference asset URLs from `hypera.com.br` were provided but were **not network-accessible** from
  this environment, so the logo was cropped from the PPTX instead (see Caveats).

---

## Content fundamentals — how Hypera writes

- **Language:** Brazilian Portuguese (pt-BR).
- **Voice:** institutional, warm, reassuring. Speaks as "nós" (we) about the company and addresses
  people collectively ("as pessoas", "as famílias"), not a casual second person.
- **Tone:** confident but caring — built around *cuidado* (care), *saúde* (health), *confiança*
  (trust) and *bem-estar* (well-being). Avoids hype and superlatives; leans on credibility.
- **Casing:** sentence case for headings and buttons. **No ALL-CAPS** on buttons or links.
  Small uppercase is reserved for tiny eyebrows/labels with letter-spacing.
- **Buttons / CTAs:** verb-led and short — "Conheça a Hypera", "Nossos produtos", "Saiba mais",
  "Ver tudo", "Loja Hypera".
- **Emoji:** none. This is a regulated pharma brand — keep it clean and professional.
- **Examples:** "Cuidar da saúde das pessoas é o que nos move." · "Marcas em que o Brasil confia."
  · "Uma das maiores farmacêuticas do Brasil."

---

## Visual foundations

- **Color:** institutional blue `#0062AA` is the backbone — buttons, links, headings, icons.
  Dark blue `#074878` is for dark surfaces, headers and pressed/hover states. Cyan `#00BFDF` is the
  single accent (eyebrows, underlines, chart highlights, dividers). Light blue `#A9D0EE` and the
  very-light `#EDF6FC` background carry support fills and alternating sections. Neutrals are warm
  greys (`#292A2B` ink, `#434445` body, `#5D5F61` muted) on white.
- **Type:** one family — **Asap** (Google Fonts), weights 400/500/600/700. H1/H2 are 36px/700;
  body is 16–17px/400 at line-height ~1.45. Headings in ink, body in `#434445`, links in blue.
- **Backgrounds:** predominantly white, with sections alternating to `#EDF6FC`. Hero/cover imagery
  is cool-toned blue with subtle DNA/molecule textures and a curved "swoosh" motif (from the
  brand mark). Section dividers use a blue→dark-blue gradient. No warm or grainy imagery; no
  busy patterns on content areas.
- **Corner radii:** soft and consistent — **8px is the default** (buttons, cards, inputs); 6px for
  small chips, 15–18px for large feature cards, and a full pill (`800px`) for carousel/circular
  buttons and badges.
- **Cards:** white, 1px `#EFEFEF` border, 8–18px radius, **soft discreet shadow** (low-opacity blue
  tint), lifting slightly on hover when interactive. Never heavy drop-shadows.
- **Shadows:** all tinted with the brand blue at low opacity (`rgba(7,72,120,.06–.12)`), kept
  subtle — clean pharma, not material-design depth.
- **Borders & dividers:** hairline `#EFEFEF`; a 4–5px cyan pill rule is the signature heading
  accent.
- **Buttons:** primary = solid blue fill, white text, radius 8px, padding 8px 24px, weight 400,
  not uppercase; hover darkens to `#074878`, active a touch darker with a 1px press translate.
  Secondary = white with a 1px blue border.
- **Hover states:** links underline + darken to dark-blue; solid buttons darken; cards lift +
  deepen shadow; soft surfaces tint toward `#EDF6FC`.
- **Press states:** darker blue + 1px downward nudge. No bouncy/elastic motion.
- **Motion:** restrained. Short ease transitions (~.15–.2s) on color/shadow/transform. No infinite
  loops, no flashy entrances. Calm and corporate.
- **Transparency / blur:** minimal; scrims over hero imagery use a solid-blue gradient overlay
  rather than glassy blur.
- **Layout:** centered max-width container (~1200px), generous 64px section padding, airy gutters.

---

## Iconography

- **System:** **Material Symbols Outlined** (Google Fonts) — the same set Hypera uses. Loaded via
  `styles.css`, used through `<span class="material-symbols-outlined">name</span>` or the `icon`
  prop on `Button`, `IconButton`, `Input`, `Badge`, etc.
- **Style:** outlined (not filled), regular weight, matching the thin clean line of the brand.
  Blue (`#0062AA`) on light, white on blue.
- **Common glyphs:** `shopping_cart` (Loja Hypera), `search`, `chevron_left/right` (carousel),
  `arrow_forward`, `check_circle`, `science`, `medication`, `local_pharmacy`, `verified`,
  `mail`, `language`.
- **No emoji.** No hand-drawn or one-off SVG icons — stick to Material Symbols for consistency.
- **Brand mark:** the Hypera "swoosh + droplet" logo is the only bespoke graphic; use the supplied
  official **SVGs** (`assets/logo-hypera.svg` on light, `assets/logo-hypera-branco.svg` on dark) —
  do not redraw it.

---

## Index / manifest

**Foundations**
- `styles.css` — global entry point (consumers link this). `@import`s everything below.
- `tokens/colors.css` · `typography.css` · `spacing.css` · `radii.css` · `shadows.css`
- `guidelines/*.html` — specimen cards (colors, type, spacing, radii, elevation, logo).

**Components** (`window.HyperaPharmaDesignSystem_e2c335.*`)
- `components/buttons/` — `Button`, `IconButton`
- `components/forms/` — `Input`, `Select`, `Checkbox`, `Switch`
- `components/data-display/` — `Card`, `Badge`, `Tag`
- `components/navigation/` — `Navbar`, `Link`
- `components/layout/` — `Footer`

**UI kit**
- `ui_kits/hypera-site/` — corporate homepage recreation (hero · brands · highlights · news).

**Slides**
- `slides/` — deck templates from the PPTX: capa, divisória de seção, conteúdo (2 colunas),
  tabela/ranking, encerramento.

**Assets** (`assets/`)
- `logo-hypera.svg` (official, color), `logo-hypera-branco.svg` (official, white-on-dark),
  `cover-blue.jpg`, `cover-blue-textured.jpg`, `cover-light.jpg`, `bg-light-corner.png`.

---

## Caveats
- The `hypera.com.br` asset URLs are **blocked / CORS-restricted** from this environment, so the
  primary Hypera Pharma logo was sourced as a **crisp official SVG from a public vector mirror**
  (`assets/logo-hypera.svg`); the white-on-dark variant (`assets/logo-hypera-branco.svg`) was
  derived from it. If you have the exact official `logo-hypera.svg` / `logo-hypera-branco.svg`
  files, upload them and I'll drop them in 1:1. Group/product brand logos (Mantecorp, Simple
  Organic, Bioage; Neosaldina, Buscopan, etc.) and the `.webp` banners could **not** be fetched —
  please upload them and I'll wire them into the brand strip and banners.
- Brand wordmarks in the UI kit (Neosaldina, Buscopan, etc.) and news imagery are **placeholders**
  pending those uploads. Add licensed packshots/photography for production.
- **Asap** is loaded from Google Fonts (matches the spec exactly — no substitution needed).
