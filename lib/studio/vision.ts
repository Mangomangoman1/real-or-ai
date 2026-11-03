import { generateObject } from "ai";
import { gateway } from "@ai-sdk/gateway";
import sharp from "sharp";
import { z } from "zod";
import type { Photo } from "./commons";

export const VISION_MODEL = process.env.STUDIO_VISION_MODEL || "anthropic/claude-sonnet-5.5";

const PICK_RULES = `A photo can be used only if ALL of these hold:
- It is an ordinary, unedited-looking photograph (not an illustration, render, collage, panorama stitch, HDR-heavy or obviously filtered image, and not black and white).
- No people anywhere: no faces, bodies, hands, crowds, reflections of people, statues of real people, or portraits on posters.
- No readable text, logos, brand names, licence plates or signage that matters to the picture.
- Not a famous, instantly recognisable landmark or artwork (a generic lighthouse is fine; the Eiffel Tower is not).
- One clear subject that still works when cropped to a 4:3 landscape frame.
- Rich, natural detail an AI could plausibly imitate, so the round is a fair test rather than a giveaway.`;

/** Look at a handful of Commons candidates and choose the best one for a round. */
export async function pick(query: string, photos: Photo[], thumbs: Uint8Array[]) {
  const { object } = await generateObject({
    model: gateway(VISION_MODEL),
    schema: z.object({
      choice: z.number().int().describe("Index of the best usable photo, or -1 if none is usable"),
      subject: z.string().describe('Short lowercase name for the subject, like "a red panda" or "a bowl of pho"'),
      reason: z.string().describe("One sentence on why it was chosen or why none work"),
    }),
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `You are choosing a real photograph for "Real or AI", a daily game where players see a real photo beside an AI-generated twin and must spot the fake. The theme for this round is: "${query}".\n\n${PICK_RULES}\n\nHere are ${photos.length} candidates, numbered from 0. Prefer the most natural, detailed, everyday-looking photo that fits the theme.`,
          },
          ...thumbs.flatMap((t, i) => [
            { type: "text" as const, text: `Candidate ${i}: ${photos[i].title}` },
            { type: "image" as const, image: t },
          ]),
        ],
      },
    ],
  });
  return object;
}

/** Write the description the twin is made from. It must describe, not judge. */
export async function describe(subject: string, image: Uint8Array) {
  const { object } = await generateObject({
    model: gateway(VISION_MODEL),
    schema: z.object({
      description: z.string(),
      people: z.boolean().describe("True if any person, face or body part is visible at all"),
    }),
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Describe this photograph of ${subject} so precisely that an image model could recreate a near-identical photo from your words alone. Write one paragraph of 90 to 140 words. Start with the kind of photograph (for example "Close-up wildlife photograph of..."). Cover the subject and its exact pose or arrangement, colours and textures, where things sit in the frame (left, centre, right, foreground, background), the background, the light (direction, time of day, weather), and the camera (lens feel, angle, depth of field). Describe only what is visible. Do not mention that it is real, do not name the photographer or place, and do not mention people unless they are visible.`,
          },
          { type: "image", image },
        ],
      },
    ],
  });
  return object;
}

/** Draw a lettered 10×10 grid so the model can say where the tell is. */
async function gridded(image: Uint8Array) {
  const W = 1200, H = 900;
  const cells = Array.from({ length: 10 }, (_, i) => i);
  const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    ${cells.map((i) => `<line x1="${(i * W) / 10}" y1="0" x2="${(i * W) / 10}" y2="${H}" stroke="rgba(255,0,80,0.55)" stroke-width="1.5"/>`).join("")}
    ${cells.map((i) => `<line x1="0" y1="${(i * H) / 10}" x2="${W}" y2="${(i * H) / 10}" stroke="rgba(255,0,80,0.55)" stroke-width="1.5"/>`).join("")}
    ${cells.flatMap((r) => cells.map((c) => `<text x="${(c * W) / 10 + 4}" y="${(r * H) / 10 + 15}" font-family="sans-serif" font-size="13" fill="rgba(255,255,255,0.9)" stroke="rgba(0,0,0,0.6)" stroke-width="0.6">${"ABCDEFGHIJ"[c]}${r + 1}</text>`)).join("")}
  </svg>`;
  return new Uint8Array(
    await sharp(image).resize(W, H, { fit: "fill" }).composite([{ input: Buffer.from(svg) }]).jpeg({ quality: 85 }).toBuffer(),
  );
}

const TELL_EXAMPLES = `Examples of the voice we want:
- "The snow flecks sit on top of the fur like confetti, all the same crisp size, and a few hang in mid-air in front of the face. Real snow clumps and sinks into fur."
- "The rear fender arches over nothing. There's no wheel under it, just grass, while a stray black tyre shape pokes out under the corner of the bed."
- "Check the reeds in the bottom left. They don't meet a mirrored copy at the waterline; the stems just carry on down through the reflection."`;

/** Find the one thing that gives the AI image away, and where it is. */
export async function tell(subject: string, real: Uint8Array, ai: Uint8Array) {
  const grid = await gridded(ai);
  const { object } = await generateObject({
    model: gateway(VISION_MODEL),
    schema: z.object({
      tell: z.string().describe("The tell, 18 to 40 words, for players, in plain friendly English"),
      cell: z.string().describe('Grid cell at the centre of the tell, like "D7" (column letter A-J, row number 1-10)'),
      difficulty: z.number().int().min(1).max(5).describe("1 = the AI image is obvious at a glance, 5 = very hard even when zoomed"),
      giveaway: z.boolean().describe("True if the pair is unfair: the AI image is plainly fake at thumbnail size, or the two images differ so much in composition or style that matching gives it away"),
    }),
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `"Real or AI" shows players two photos of ${subject}. One is a real photograph; the other was generated by AI from a written description of it. After they guess, we show the single best visual "tell": a concrete, checkable flaw in the AI image that a careful player could find by zooming in. Good tells are physical or logical mistakes (impossible anatomy, objects merging, missing or extra parts, broken reflections or shadows, repeating textures, nonsense structure). Do not use vague tells like "too smooth" or "looks artificial" unless nothing concrete exists. Never describe the real photo as having flaws.\n\n${TELL_EXAMPLES}\n\nImage 1 is the REAL photograph. Image 2 is the AI image. Image 3 is the AI image again with a labelled grid (columns A-J left to right, rows 1-10 top to bottom); use it only to say where the tell is.`,
          },
          { type: "image", image: real },
          { type: "image", image: ai },
          { type: "image", image: grid },
        ],
      },
    ],
  });
  const m = /^([A-J])\s*(10|[1-9])$/i.exec(object.cell.trim());
  const x = m ? ("ABCDEFGHIJ".indexOf(m[1].toUpperCase()) + 0.5) / 10 : 0.5;
  const y = m ? (Number(m[2]) - 0.5) / 10 : 0.5;
  return { text: object.tell.trim(), x, y, difficulty: object.difficulty, giveaway: object.giveaway };
}
