import { NextResponse } from "next/server";
import { generateImage, generateText } from "ai";
import { gateway } from "@ai-sdk/gateway";
import { denied, pipelineEnabled } from "@/lib/pipeline/guard";
import { normalise, store } from "@/lib/pipeline/media";
import source from "@/data/source.json";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

type Src = { id: string; description: string };

// Ask for an ordinary, unretouched photo. Over-polished AI images are too easy to spot.
const STYLE =
  " Shot as a real, unedited photograph: natural light, true-to-life colour, realistic depth of field, subtle sensor noise, no text, no watermark, no border, no people.";

export async function GET(req: Request) {
  if (!pipelineEnabled()) return denied();
  const q = new URL(req.url).searchParams;
  const id = q.get("id");
  const model = q.get("model") || "bfl/flux-2-pro";
  const item = (source as Src[]).find((s) => s.id === id);
  if (!item) return NextResponse.json({ error: "unknown id" }, { status: 400 });
  const prompt = item.description.trim() + STYLE;

  try {
    let bytes: Uint8Array;
    if (model.startsWith("google/gemini")) {
      // Gemini image models answer through the text API with image files.
      const res = await generateText({
        model: gateway(model),
        prompt: prompt + " Aspect ratio 4:3, landscape.",
        providerOptions: { google: { responseModalities: ["IMAGE"] } },
      });
      const file = res.files.find((f) => f.mediaType.startsWith("image/"));
      if (!file) throw new Error("no image returned");
      bytes = file.uint8Array;
    } else {
      const res = await generateImage({ model: gateway.imageModel(model), prompt, aspectRatio: "4:3" });
      bytes = res.image.uint8Array;
    }
    const buf = await normalise(Buffer.from(bytes));
    const url = await store(item.id, "ai", buf);
    return NextResponse.json({ id, model, url, bytes: buf.length });
  } catch (e) {
    return NextResponse.json({ id, model, error: String(e).slice(0, 500) }, { status: 500 });
  }
}
