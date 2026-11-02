export type Credit = {
  author: string;
  license: string;
  licenseUrl?: string;
  sourceUrl: string;
  sourceName: string;
};

export type Round = {
  id: string;
  subject: string;
  /** Real photo, already cropped to 4:3 */
  real: { src: string; credit: Credit };
  /** AI twin made from a written description of the real photo */
  ai: { src: string; model: string; prompt?: string };
  /** What gives the AI image away, and where (0 to 1 from top left) */
  tell: { text: string; x: number; y: number };
  /** Placeholder rounds draw a stand-in instead of photos */
  placeholder?: boolean;
};

export type Day = {
  no: number;
  theme?: string;
  rounds: Round[];
};

export type PuzzleFile = {
  launch: string; // YYYY-MM-DD, puzzle No. 1
  days: Day[];
};
