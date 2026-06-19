import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

function getClient() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

export async function POST(req: NextRequest) {
  try {
    const { image } = await req.json();

    // Step 1: Google Vision OCR
    const visionRes = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${process.env.GOOGLE_VISION_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requests: [
            {
              image: { content: image },
              features: [{ type: "TEXT_DETECTION" }],
            },
          ],
        }),
      }
    );

    const visionData = await visionRes.json();
    const rawText =
      visionData.responses?.[0]?.fullTextAnnotation?.text || "";

    if (!rawText) {
      return Response.json({ error: "No text found on card" }, { status: 400 });
    }

    // Step 2: Claude structures the text
    const message = await getClient().messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 512,
      messages: [
        {
          role: "user",
          content: `Extract contact details from this business card text. Return ONLY valid JSON with these fields: name, phone, email, company, designation, website, address. Use empty string for missing fields. For phone, include country code if visible. Clean up formatting.\n\nCard text:\n${rawText}`,
        },
      ],
    });

    const content = message.content[0];
    const text = content.type === "text" ? content.text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const structured = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

    return Response.json(structured);
  } catch (error) {
    console.error("OCR error:", error);
    return Response.json({ error: "OCR processing failed" }, { status: 500 });
  }
}
