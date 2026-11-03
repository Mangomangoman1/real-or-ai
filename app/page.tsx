import Game from "@/components/Game";
import { available } from "@/lib/puzzles";

// Rebuilt hourly, so tomorrow's puzzle shows up without shipping the whole bank.
export const revalidate = 3600;

export default function Page() {
  const { launch, days, total } = available();
  return <Game launch={launch} days={days} total={total} />;
}
