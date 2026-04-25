[🇷🇺 Русская версия](README.ru.md)

# GURPS Roll Reactions

A Foundry VTT module for the GURPS system that displays visual reactions — GIFs or images — in chat messages based on roll results.

## Features

- **Per-actor configuration** — each actor has its own set of reactions, configured from the character sheet
- **Three trigger types:** Skills, Weapons (attack/parry/block), Universal (any custom text)
- **Result-based reactions** — separate images for success, failure, critical success, critical failure
- **Cascade fallback** — if a specific result image isn't set, falls back to the default image
- **Reaction test modal** — preview which image will appear for a given skill level and roll, without making an actual roll
- **Import / Export** — save all actor reactions to a JSON file and restore or copy them to another actor
- **Reaction manager** — GM tool to view and delete reactions per actor, or reset all at once
- **Localization** — Russian and English

## Usage

### 1. Open the configuration

Click the **Reactions** button in the actor sheet header.

![Reactions button in sheet header](screenshots/header-button.png)

### 2. Configure triggers

Three tabs: **Skills**, **Weapons**, **Universal**. Enter the trigger name (must match the text in chat rolls) and paste image/GIF URLs.

<table>
<tr>
<td><img src="screenshots/skill-dialog.png" width="320" alt="Skill dialog"/><br><sub>Skill reactions</sub></td>
<td><img src="screenshots/weapon-dialog.png" width="320" alt="Weapon dialog"/><br><sub>Weapon reactions (atk/parry/block)</sub></td>
<td><img src="screenshots/universal-dialog.png" width="320" alt="Universal dialog"/><br><sub>Universal triggers</sub></td>
</tr>
</table>

### 3. Result in chat

After a roll, the matching image appears automatically in the chat message.

<table>
<tr>
<td><img src="screenshots/chat-reaction.png" width="280" alt="Chat reaction"/><br><sub>Normal result</sub></td>
<td><img src="screenshots/chat-crit.png" width="280" alt="Chat crit with glow"/><br><sub>Critical result with glow</sub></td>
</tr>
</table>

### Import / Export reactions

Open the Universal Triggers dialog for any actor. At the bottom of the dialog there are two buttons:

- **Export** — downloads a `grr-<ActorName>.json` file with all reactions for that actor (skills, weapons, and universal triggers)
- **Import** — loads a previously exported JSON file and applies it to the current actor; merges with existing data

This lets you back up reaction configs, copy them between actors, or share them with other GMs.

### GM: Manage Reactions

**Game Settings → Manage Reactions** — view and delete configured reactions per actor, or reset all at once.

## Settings

| Setting | Scope | Description |
|---|---|---|
| Glow on Critical Rolls | Per player | Enables a green/red glowing border on critical success/failure |
| Manage Reactions | GM only | View and delete reactions per actor, or reset all |

## Compatibility

- Foundry VTT: v11–v13
- System: GURPS (gurps)
