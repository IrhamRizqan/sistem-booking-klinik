# Design — Practo-inspired

Locked design system. Future Hallmark runs read this file first; pages defer
to it. Amend intentionally — the file is the rule.

## System
- Genre · editorial
- Macrostructure · Marquee Hero
- Theme · studied-DNA (vibe: "clean, modern, healthcare")
- Axes · light / neutral grotesque / cyan-blue

## Provenance
- Source mode: image (user-attached)
- Date: 2026-07-17
- Attestation: User-owned source
- Confidence: Tokens are estimated from source-image colour bands. Fonts are role-based with named candidates from the Hallmark canon. Rhythm is from a vision pass on the source.

## Tokens (canonical · `tokens.css` is the source of truth)
```css
:root {
  --color-paper:      oklch(99% 0.005 260);
  --color-paper-2:    oklch(96% 0.008 260);
  --color-ink:        oklch(15% 0.02 260);
  --color-ink-2:      oklch(30% 0.03 260);
  --color-rule:       oklch(85% 0.01 260);
  --color-accent:     oklch(55% 0.1 240);
  --color-accent-ink: oklch(10% 0.05 240);
  --color-focus:      oklch(55% 0.1 240);

  --font-display: "Inter", system-ui, sans-serif;
  --font-body:    "Inter", system-ui, sans-serif;
  --font-mono:    "IBM Plex Mono", monospace;

  /* 4-pt spacing scale, named: --space-3xs … --space-4xl. See tokens.css.   */
  /* Type scale, 1.25 (major-third) ratio: --text-xs … --text-display.       */

  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --dur-fast: 180ms;  --dur-base: 240ms;  --dur-slow: 320ms;

  --radius-card: 8px;  --radius-pill: 9999px;  --radius-input: 4px;
}
```

## CTA voice
- Primary · fill colour · pill radius · generous padding
- Secondary · outline / ghost · same radius

## Motion stance
- silent · (not-visible) reveal primitives · motion-cut
- Reduced-motion fallback · ≤150 ms opacity crossfade.

## Exports
`tokens.css` (in this project) is the source of truth. For Tailwind v4
`@theme`, DTCG `tokens.json`, or shadcn/ui CSS variables, ask "extend
design.md with Tailwind exports" (or the format you want) — Hallmark will
append them per [`export-formats.md`](export-formats.md).

## Notes
Anti-patterns I'd skip: nothing from this screenshot stands out as carry-over risk. The reference is clean.
