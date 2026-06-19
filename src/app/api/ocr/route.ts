import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

function getClient() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

export async function POST(req: NextRequest) {
  try {
    const { image } = await req.json();

    const message = await getClient().messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 512,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: "image/jpeg",
                data: image,
              },
            },
            {
              type: "text",
              text: `This is a photo of a business/visiting card. Extract all contact details and return ONLY valid JSON with these fields: name, phone, email, company, designation, website, address. Use empty string for missing fields. For phone, include country code if visible. Clean up formatting.`,
            },
          ],
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
