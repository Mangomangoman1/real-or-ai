import { notFound } from "next/navigation";
import { pipelineEnabled } from "@/lib/pipeline/guard";
import Studio from "./Studio";

export const dynamic = "force-dynamic";

export default function Page() {
  if (!pipelineEnabled()) notFound();
  return <Studio />;
}
