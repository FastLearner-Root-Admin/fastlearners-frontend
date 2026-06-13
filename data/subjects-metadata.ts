// This is UI metadata only - actual subjects come from API
export const subjectIcons: Record<string, string> = {
  "General Mathematics": "🔢",
  "English Language": "📚",
  "Civic Education": "🏛️",
  Biology: "🧬",
  Physics: "⚛️",
  Chemistry: "🧪",
  "Christian Religious Studies": "✝️",
  "Islamic Religious Studies": "☪️",
  "Religious and Moral Education": "📖",
  "Agricultural Science": "🌾",
  "Further Mathematics": "📐",
  Economics: "📊",
  Geography: "🗺️",
  "Computer Studies": "💻",
  "Technical Drawing": "📏",
  Government: "🏛️",
  "Literature in English": "📖",
  History: "📜",
  Commerce: "💼",
  Accounting: "📊",
  "Financial Accounting": "💰",
  "Business Studies": "💼",
  "Fine Arts": "🎨",
  Music: "🎵",
  French: "🇫🇷",
  Yoruba: "🇳🇬",
  Igbo: "🇳🇬",
  Hausa: "🇳🇬",
  // Add more as needed
};

export const academicTerms = [
  { id: "1", name: "First Term", description: "September - December" },
  { id: "2", name: "Second Term", description: "January - April" },
  { id: "3", name: "Third Term", description: "May - August" },
];

export const disciplines = [
  {
    value: "Science",
    label: "Science",
    description:
      "For students pursuing medicine, engineering, or science-related fields",
    icon: "🔬",
  },
  {
    value: "Art",
    label: "Arts/Humanities",
    description:
      "For students interested in law, languages, or social sciences",
    icon: "📚",
  },
  {
    value: "Commercial",
    label: "Commercial",
    description:
      "For students interested in business, accounting, or economics",
    icon: "💼",
  },
];

export function getSubjectIcon(subjectName: string): string {
  return subjectIcons[subjectName] || "📖";
}

export function getClassCategory(className: string): "jss" | "sss" | null {
  if (!className) return null;
  return className.startsWith("JSS")
    ? "jss"
    : className.startsWith("SSS")
      ? "sss"
      : null;
}

export function getSelectiveRequirement(className: string): number {
  const category = getClassCategory(className);
  return category === "jss" ? 2 : 4; // JSS: 2, SSS: 4
}
