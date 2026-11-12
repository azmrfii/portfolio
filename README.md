# Forest Portfolio

Interactive **top-down town** portfolio with asphalt roads, a walkable bridge over a fish pond, and canvas-drawn chibi avatars.

Built with **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, and **HTML5 Canvas**.

Explore a compact map following a winding path: Rumah → Sekolah → jembatan → Kuliah → Kantor.

## Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Controls

| Input | Action |
| --- | --- |
| WASD / Arrow keys | Walk (8-direction) |
| Space / Wave | Wave animation |
| E / Enter / click building | Open modal |
| Esc | Close modal |
| HUD jump buttons | Teleport to area |
| Mobile D-pad | Move + Wave + E |

## Structure

- `src/data/worldData.ts` — 2D building/NPC/decor coordinates + modal copy
- `src/lib/canvas/` — ground, paths, buildings, player, NPCs (Y-sorted depth)
- `src/components/` — GameCanvas, HUD minimap, modal, virtual controls

## Customize

Edit texts and `x`/`y` positions in `src/data/worldData.ts`. Swap procedural draws in `src/lib/canvas/draw*.ts` for sprite sheets later.
