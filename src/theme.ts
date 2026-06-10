// Design tokens - Brutalist Mobile Light personality
export const colors = {
  surface: "#FFFFFF",
  onSurface: "#111111",
  surfaceSecondary: "#F4F4F4",
  onSurfaceSecondary: "#333333",
  surfaceTertiary: "#E8E8E8",
  onSurfaceTertiary: "#555555",
  surfaceInverse: "#111111",
  onSurfaceInverse: "#FFFFFF",
  brand: "#E32636",
  onBrand: "#FFFFFF",
  border: "#E8E8E8",
  borderStrong: "#111111",
  divider: "#111111",
  muted: "#888888",
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const radius = {
  sm: 0,
  md: 0,
  lg: 0,
  pill: 0,
};

export const fonts = {
  display: "System",
  body: "System",
  mono: "Courier",
};

export const EVENT_TYPES: { id: string; label: string }[] = [
  { id: "all", label: "VŠE" },
  { id: "autorske_cteni", label: "Autorské čtení" },
  { id: "diskuze", label: "Diskuze" },
  { id: "festival", label: "Festival" },
  { id: "krest_knihy", label: "Křest knihy" },
  { id: "prednaska", label: "Přednáška" },
  { id: "workshop", label: "Workshop" },
];

export const LANGUAGES: { id: string; label: string }[] = [
  { id: "cs", label: "Čeština" },
  { id: "en", label: "Angličtina" },
  { id: "de", label: "Němčina" },
  { id: "fr", label: "Francouzština" },
  { id: "es", label: "Španělština" },
  { id: "multi", label: "Vícejazyčné" },
];

export function languageLabel(id?: string | null): string {
  if (!id) return "";
  const f = LANGUAGES.find((l) => l.id === id);
  return f ? f.label : id;
}

export function eventTypeLabel(id: string): string {
  const found = EVENT_TYPES.find((t) => t.id === id);
  return found ? found.label : id;
}

export function formatDate(iso: string): string {
  // YYYY-MM-DD -> DD.MM.YYYY
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
}

export function shortDate(iso: string): { day: string; month: string } {
  const [, m, d] = iso.split("-");
  const months = [
    "LED",
    "ÚNO",
    "BŘE",
    "DUB",
    "KVĚ",
    "ČER",
    "ČVC",
    "SRP",
    "ZÁŘ",
    "ŘÍJ",
    "LIS",
    "PRO",
  ];
  return { day: d, month: months[parseInt(m, 10) - 1] };
}
