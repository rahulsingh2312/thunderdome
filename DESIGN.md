# Design

## Visual world: the Holo-Colosseum

A holographic arena projection. The dome is a glowing wireframe geodesic hologram standing on an
infinite grid floor; six orbs in channel colours orbit inside it leaving light trails. The page
chrome is an esports HUD: panels with corner brackets, faint scanlines over everything, tech
display type, mono data. Chosen by the user over a CRT-broadcast and an arcade direction.

The 3D scene is the one authored moment. Everything else is functional HUD motion: detents,
digit rolls, a pulse on the live lamp. `prefers-reduced-motion` renders a single static frame.
The scene responds to theme (canvas colours re-read from CSS tokens on theme change), caps DPR
at 1.5, pauses when offscreen or hidden, and falls back to the static graticule when WebGL is
unavailable.

## Colour

Dark is the spectacle default; light is the blueprint hangar variant. Both ship, all tokens.

Dark: ground `#05070d`, panel `#0b111dcc`, holo line `#35e0ff`, ink `#e8f4ff`.
Light: ground `#eef3f8`, panel `#ffffffd9`, holo line `#0b66c3`, ink `#0a1626`.
Semantic up `#3dff8c`/`#0f7a3d`, down `#ff5c5c`/`#cf3520`. Channels are neon, never pure
green or red: gold, cyan, pink, violet, orange, blue.

## Type

Chakra Petch (display and UI; italic 700 for headlines) + IBM Plex Mono (every number,
tabular). Two families, self-hosted through next/font.

## Motion

**The one authored moment:** on first paint the six traces sweep left to right like a scope
sweep, staggered by rank, phosphor glow trailing and decaying behind the leading edge. It runs
once. Nothing else on the page competes with it.

Everything after is small and functional: a detent when a knob or mode changes, a digit roll when
a readout updates, a slow pulse on the trigger lamp while the desk is armed. Only the value that
changed animates; the board never re-animates wholesale on a tick.

Exponential ease-out, short, interruptible, from an already-visible default. `prefers-reduced-motion`
replaces the sweep with the finished traces already drawn, and stills the lamp.

## Depth

The panel sits above the ground on a real shadow with offset and soft blur, never a zero-offset
halo. The graticule is etched *into* the panel (inset shadow), the traces glow *above* it
(drop-shadow in the trace's own colour, low alpha). That three-layer order is the depth system.

## Browser surfaces

Themed from the palette, not left to the browser: text selection, caret, scrollbar, focus ring,
underline offset, and tabular numerals in every data cell.

## Refused for this world

No eyebrow labels. No same-size card grid as page structure. No gradient text. No glass as
decoration. No section numbers. No emoji or unicode standing in for icons; icons are authored SVG
on one stroke weight, drawn from the bench (knob, probe, lamp, arrow/fletching). No hero-metric
template. No sparkline standing in for content, though a sparkline of real data is content.

## Bilingual

EN and 中文 ship together. Chrome and dynamic content both. Filter keys, enum values, model IDs
and mode names never translate. Numerals stay Arabic. Missing translation falls back to English.
