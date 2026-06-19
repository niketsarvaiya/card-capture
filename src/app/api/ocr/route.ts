import { NextRequest } from "next/server";
import OpenAI from "openai";

function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
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

    // Step 2: AI structuring
    const completion = await getOpenAI().chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `Extract contact details from this business card text. Return ONLY valid JSON with these fields: name, phone, email, company, designation, website, address. Use empty string for missing fields. For phone, include country code if visible. Clean up formatting.`,
        },
        { role: "user", content: rawText },
      ],
      response_format: { type: "json_object" },
      temperature: 0,
    });

    const structured = JSON.parse(
      completion.choices[0].message.content || "{}"
    );

    return Response.json(structured);
  } catch (error) {
    console.error("OCR error:", error);
    return Response.json({ error: "OCR processing failed" }, { status: 500 });
  }
}
