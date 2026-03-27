[🇷🇺 Русская версия](README.ru.md)

# GURPS Roll Reactions

A Foundry VTT module for the GURPS system that displays visual reactions — GIFs or images — in chat messages based on roll results.

## Features

- **Per-actor configuration** — each actor has its own set of reactions, configured directly from the character sheet
- **Three trigger types:**
  - **Skills** — triggered by skill name appearing in a chat roll message
  - **Weapons** — triggered by weapon name, with separate reactions for attack, parry, and block
  - **Universal** — triggered by any custom text (attributes, secondary characteristics, advantages, etc.)
- **Result-based reactions** — different images for success, failure, critical success, and critical failure
- **Cascade logic** — if a specific result image is not set, falls back to the default image
- **Reaction test modal** — preview which image will appear for a given skill level and dice roll, without making an actual roll
- **Reaction manager** — GM tool to view and delete reactions per actor, or reset all reactions at once
- **Localization** — Russian and English supported

## Settings

| Setting | Scope | Description |
|---|---|---|
| Glow on Critical Rolls | Per player | Enables a green/red glowing border around images on critical success/failure |
| Manage Reactions | GM only | View and delete configured reactions per actor, or reset all at once |

## Compatibility

- Foundry VTT: v11–v13
- System: GURPS (gurps)
