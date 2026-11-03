/** Share links look like /s/12-10111: the puzzle number, then 1 for spotted and 0 for fooled. */
export function shareCode(no: number, picks: boolean[]) {
  return `${no}-${picks.map((p) => (p ? 1 : 0)).join("")}`;
}

export function parseShare(code: string) {
  const m = /^(\d{1,4})-([01]{1,5})$/.exec(code);
  if (!m) return null;
  const picks = [...m[2]].map((c) => c === "1");
  return { no: Number(m[1]), picks, score: picks.filter(Boolean).length };
}
