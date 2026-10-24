// Editorial structure for the public site, taken from The Spotlight's
// Founding Brief and Public Identity Overview. No stories are listed here
// yet — add real, published pieces to `stories` as they go live.

export interface Desk {
  slug: string;
  name: string;
  purpose: string;
}

export const DESKS: Desk[] = [
  { slug: "profiles", name: "Spotlight Profiles", purpose: "Recognize and tell the stories of remarkable people." },
  { slug: "academia", name: "Academia & Learning", purpose: "Share knowledge, research, academic journeys, and useful learning." },
  { slug: "technology", name: "Technology & Innovation", purpose: "Make technology, AI, innovation, and emerging skills accessible." },
  { slug: "creativity", name: "Creativity & Culture", purpose: "Give visibility to creative work and campus culture." },
  { slug: "careers", name: "Careers & Opportunities", purpose: "Surface practical career guidance and opportunities." },
  { slug: "business", name: "Business & Entrepreneurship", purpose: "Explore student businesses, founders, ideas, and lessons from building." },
  { slug: "leadership", name: "Leadership & Impact", purpose: "Highlight leadership, service, initiatives, and community impact." },
  { slug: "campus", name: "Campus & Community", purpose: "Cover relevant people, projects, organizations, and developments." },
];

export const RHYTHM = [
  { day: "Monday", focus: "Knowledge / Career / AI", role: "Useful value to begin the week." },
  { day: "Wednesday", focus: "Deep Dive / Opportunity / Business", role: "Depth, insight, or a practical opportunity." },
  { day: "Friday", focus: "Spotlight Profile", role: "Our signature recognition feature." },
  { day: "Sunday", focus: "Reflection / Story / Planning", role: "A lighter piece for the week ahead." },
];

export const PROFILE_PARTS = [
  { name: "The Introduction", question: "Who is this person and why should we care?" },
  { name: "The Person", question: "Personality, interests, motivation, and identity." },
  { name: "The Journey", question: "Where did the story begin?" },
  { name: "The Spark", question: "What made them start?" },
  { name: "The Challenge", question: "What obstacles or uncertainty did they face?" },
  { name: "The Work", question: "What have they actually done?" },
  { name: "The Lesson", question: "What can another student learn?" },
  { name: "Why We Chose Them", question: "Why they deserve attention." },
  { name: "The Future", question: "What are they building or pursuing next?" },
  { name: "Quick Spotlight", question: "A short, memorable set of personal questions." },
];

export const CRITERIA = [
  "Impact",
  "Initiative",
  "Excellence",
  "Creativity",
  "Innovation",
  "Leadership",
  "Growth",
  "Service",
  "Distinctiveness",
  "Actionable lessons",
];

export const AUDIENCE_FEELINGS = [
  { quote: "I didn't know they were doing that.", label: "Discovery" },
  { quote: "I learned something.", label: "Value" },
  { quote: "I want to share this.", label: "Connection" },
  { quote: "Maybe I can do something too.", label: "Inspiration" },
];

export interface Story {
  desk: Desk["slug"];
  title: string;
  dek: string;
  href: string;
  publishedAt: string; // ISO date
}

/** Published stories, newest first. Empty until the first pieces go live. */
export const stories: Story[] = [];
