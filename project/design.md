# Design

Goal: faithful to the source design at `https://summit.adobe.com/na/` at desktop (1440px) and mobile (390px) widths.

- Take design tokens (colors, font families, type scale, spacing, radii) from the source and define them as CSS custom properties in `events/styles/styles.css`, scoped so they only apply to pages under `/drafts/ema-poc/` (for example via a page `theme` metadata class). Don't hard-code values in block CSS.
- Fonts: Milo already loads Adobe Clean; reuse it.
- Buttons: map the source's primary and secondary CTA styles to Milo button classes (`.con-button.blue`, `.con-button.outline`).

## Tokens

Fill this in after the first styling pass.

| Token | Value | Used for |
|---|---|---|

## Section styles

| Style | Effect | Blocks that work inside |
|---|---|---|
