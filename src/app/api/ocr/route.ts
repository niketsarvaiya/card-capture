import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

function getClient() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

export async function POST(req: NextRequest) {
  try {
    const { image } = await req.json();

    const message = await getClient().messages.create({
      model: "claude-haiku-4-5-20251001",
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
              text: `Extract contact details from this business card photo. Return ONLY a JSON object with EXACTLY these fields (no extra fields):
- "name": full name
- "phone": all phone/mobile numbers, comma-separated if multiple, with country code
- "email": email address
- "company": company/organization name
- "designation": job title/role
- "website": website URL
- "address": full address
Use empty string "" for any field not found on the card.`,
            },
          ],
        },
      ],
    });

    const content = message.content[0];
    const text = content.type === "text" ? content.text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const raw = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

    // Merge any extra phone/mobile fields into phone
    const phones = [raw.phone, raw.mobile, raw.tel, raw.telephone]
      .filter(Boolean)
      .join(", ");

    const structured = {
      name: raw.name || raw.full_name || "",
      phone: phones,
      email: raw.email || "",
      company: raw.company || raw.organization || raw.org || "",
      designation: raw.designation || raw.title || raw.role || raw.position || "",
      website: raw.website || raw.url || "",
      address: raw.address || "",
    };

    return Response.json(structured);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("OCR error:", msg);
    return Response.json({ error: msg }, { status: 500 });
  }
}
