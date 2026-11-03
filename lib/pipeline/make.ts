import { generateImage, generateText } from "ai";
import { gateway } from "@ai-sdk/gateway";
import { normalise, store, UA } from "./media";
import source from "@/data/source.json";

export type Src = { id: string; thumb1600: string; description: string };

// Ask for an ordinary, unretouched photo. Over-polished AI images are too easy to spot.
export const STYLE =
  " Shot as a real, unedited photograph: natural light, true-to-life colour, realistic depth of field, subtle sensor noise, no watermark, no caption, no border, no people.";

export const DEFAULT_MODEL = "bytedance/seedream-5.0-lite";

export function find(id: string | null) {
  return (source as Src[]).find((s) => s.id === id);
}

export async function makeReal(item: Src) {
  const r = await fetch(item.thumb1600, { headers: { "User-Agent": UA } });
  if (!r.ok) throw new Error(`fetch ${r.status}`);
  const buf = await normalise(Buffer.from(await r.arrayBuffer()));
  const url = await store(item.id, "real", buf);
  return { id: item.id, url, bytes: buf.length };
}

/** Make the AI image for a prompt with any gateway image model. Returns raw bytes. */
export async function twin(prompt: string, model = DEFAULT_MODEL): Promise<Uint8Array> {
  if (model.startsWith("google/gemini")) {
    // Gemini image models answer through the text API with image files.
    const res = await generateText({
      model: gateway(model),
      prompt: prompt + " Aspect ratio 4:3, landscape.",
      providerOptions: { google: { responseModalities: ["IMAGE"] } },
    });
    const file = res.files.find((f) => f.mediaType.startsWith("image/"));
    if (!file) throw new Error("no image returned");
    return file.uint8Array;
  }
  if (model.startsWith("openai/")) {
    const res = await generateImage({ model: gateway.imageModel(model), prompt, size: "1536x1024" });
    return res.image.uint8Array;
  }
  const res = await generateImage({
    model: gateway.imageModel(model),
    prompt,
    aspectRatio: "4:3",
    // Seedream stamps "AI generated" in the corner by default, which would give the game away.
    providerOptions: { bytedance: { watermark: false } },
  });
  return res.image.uint8Array;
}

export async function makeAi(item: Src, model = DEFAULT_MODEL, kind = "ai2") {
  const buf = await normalise(Buffer.from(await twin(item.description.trim() + STYLE, model)));
  // "ai2": the first batch carried a watermark, and a new name dodges year-long CDN caching of the old files.
  const url = await store(item.id, kind, buf);
  return { id: item.id, model, url, bytes: buf.length };
}
