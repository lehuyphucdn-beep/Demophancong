// A consistent set of beautiful, high-contrast colors for our Recharts and visual styling
export const CHART_COLORS = [
  "#4F46E5", // Indigo
  "#10B981", // Emerald
  "#F59E0B", // Amber
  "#EF4444", // Rose
  "#06B6D4", // Cyan
  "#8B5CF6", // Violet
  "#EC4899", // Pink
  "#14B8A6", // Teal
  "#F97316", // Orange
  "#3B82F6", // Blue
  "#84CC16", // Lime
  "#A855F7", // Purple
  "#6366F1", // Indigo light
  "#22C55E", // Green
  "#EAB308", // Yellow
];

// Helper to get a color based on a string hash so it stays consistent for the same item
export function getStringColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % CHART_COLORS.length;
  return CHART_COLORS[index];
}
