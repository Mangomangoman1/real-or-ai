import type { Metadata } from "next";
import Game from "@/components/Game";
import { available } from "@/lib/puzzles";
import { parseShare } from "@/lib/share";

export const revalidate = 3600;

/** A shared result: the link unfurls with the sharer's grid, and opens straight into today's game. */
export async function generateMetadata({ params }: { params: Promise<{ code: string }> }): Promise<Metadata> {
  const s = parseShare((await params).code);
  if (!s) return {};
  const title = `Real or AI No. ${s.no}: ${s.score}/${s.picks.length} spotted`;
  return { title, openGraph: { title, description: "Can you beat it? Five pairs, one fake in each." }, twitter: { title } };
}

export default function SharedPage() {
  const { launch, days, total } = available();
  return <Game launch={launch} days={days} total={total} />;
}
