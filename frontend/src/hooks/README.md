# Hooks (`src/hooks`)

## Purpose
Custom React hooks for shared logic across the application.

## Guidelines
- Place only **globally reusable** hooks here (e.g., `useWindowSize`, `useScroll`, `useLocalStorage`).
- Domain-specific logic or hooks that depend on specific business features should go into `src/features`.
