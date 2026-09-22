---
trigger: always_on
---

# MIRROR // YOU — DEVELOPMENT RULES

## Project Goal

Build a polished short first-person psychological puzzle game called
"MIRROR // YOU".

The game is designed for an approximately 8-hour development session
by a single developer using AI-assisted development.

The core mechanic is that the player's reflection behaves differently
from the player and becomes part of the puzzle.

## Development Rules

1. Work incrementally.
2. Implement only the feature explicitly requested in the current task.
3. Do not implement future gameplay systems unless explicitly requested.
4. Do not rewrite working systems unnecessarily.
5. Do not refactor unrelated code.
6. Preserve all existing functionality.
7. Prefer simple, reliable implementations over complex architectures.
8. Avoid unnecessary dependencies.
9. Keep systems modular and easy to replace.
10. Before changing an existing system, inspect its current implementation.
11. After implementing a task, verify that it works.
12. Report files created and modified.
13. Report any assumptions made.
14. If a requested feature conflicts with the current architecture,
    explain the conflict before making a large architectural change.
15. Never silently remove existing functionality.

## Testing Rules

After completing a feature:

1. Run the appropriate build/dev/test command.
2. Check for TypeScript errors.
3. Verify the feature in the browser when applicable.
4. Report the verification result.

If verification fails, fix the current task before moving on.

## Scope Control

The MVP consists of:

- First-person player movement
- Camera
- Interaction system
- Single primary environment
- Mirror
- Reflection
- Reflection-specific behavior
- Small puzzle sequence
- Door/escape objective
- Environmental changes
- Audio
- Ending sequence

Do NOT add:

- Multiplayer
- Open world systems
- Combat
- Inventory systems
- Skill trees
- Procedural worlds
- Complex enemy AI
- Networking
- Unnecessary backend services

## Code Quality

Use TypeScript.
Prefer small focused modules.
Use clear names.
Avoid giant files where practical.
Keep gameplay state explicit.
Avoid unnecessary global mutable state.

## AI Agent Behavior

Do not assume that a large implementation is better.

A feature that is simple and reliable is preferred over a technically
impressive implementation that increases debugging risk.

When uncertain, preserve the existing implementation and ask for the
smallest necessary change through the current task.