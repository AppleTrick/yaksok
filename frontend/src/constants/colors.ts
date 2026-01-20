export const COLORS = {
    // Main Brand Colors
    primary: '#FF5722',      // Vivid Orange (CTA, Heading, Active)
    success: '#4CAF50',      // Fresh Green (Success, Completed)
    error: '#EF4444',        // Soft Red (Error, Danger)

    // Surface/Background Colors
    white: '#FFFFFF',        // Pure White (Main background, Card)
    subBackground: '#EDF7ED', // Pale Mint (Sub background, Card background)
    sectionDivider: '#F6F0DC', // Cream Beige (Alternate background, Section divider)
    highlight: '#FFDAAB',      // Peach Beige (Time badge, Highlight, Accent)
    lightGray: '#F5F5F5',    // Light Gray (Secondary background, Borders)
    mediumGray: '#9E9E9E',   // Medium Gray (Secondary text)
    black: '#1A1A1A',        // Dark Black (Main text)

    // Contextual/Timeline Colors
    morning: '#F59E0B',      // Amber
    lunch: '#F97316',        // Orange
    dinner: '#6366F1',       // Indigo
} as const;

export type ColorType = typeof COLORS;
