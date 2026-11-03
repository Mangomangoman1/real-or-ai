import type { Credit } from "@/lib/types";

export type Status = "new" | "picked" | "made" | "drafted" | "approved" | "rejected";

/** One round as it moves through the studio: subject → photo → twin → tell → approved. */
export type Draft = {
  id: string;
  /** What to look for on Commons, e.g. "a red panda" */
  query: string;
  category?: string;
  status: Status;
  subject?: string;
  /** The real photo, as found on Commons */
  photo?: { title: string; thumb: string; width: number; height: number; credit: Credit };
  /** Written from the real photo; the twin is made from this alone */
  description?: string;
  realSrc?: string;
  ai?: { model: string; src: string };
  tell?: { text: string; x: number; y: number };
  /** 1 easy to 5 very hard, the vision model's guess */
  difficulty?: number;
  note?: string;
  /** Puzzle number it is scheduled for, once approved */
  day?: number;
  /** Failed attempts at the current stage */
  fails?: number;
  updatedAt: string;
};
