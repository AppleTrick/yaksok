# Features (`src/features`)

## Purpose
Self-contained modules containing Domain Logic + UI. This is the core of the business logic.

## Guidelines
- Each feature folder (e.g., `features/auth`, `features/search`) should be self-contained.
- A feature folder typically contains its own:
  - `components/`: Feature-specific UI.
  - `hooks/`: Feature-specific logic.
  - `api/`: API call definitions for the feature.
  - `types/`: Domain models and types.
- **Rule**: Features should act as functional units and should not be strictly tied to specific pages.
