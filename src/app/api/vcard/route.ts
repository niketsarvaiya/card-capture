import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const lead = await req.json();

  const nameParts = (lead.name || "").trim().split(/\s+/);
  const firstName = nameParts[0] || "";
  const lastName = nameParts.slice(1).join(" ");

  const vcf = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `N:${lastName};${firstName};;;`,
    `FN:${lead.name || ""}`,
    lead.phone ? `TEL;TYPE=CELL:${lead.phone}` : "",
    lead.email ? `EMAIL:${lead.email}` : "",
    lead.company ? `ORG:${lead.company}` : "",
    lead.designation ? `TITLE:${lead.designation}` : "",
    lead.website ? `URL:${lead.website}` : "",
    lead.address ? `ADR;TYPE=WORK:;;${lead.address.replace(/\n/g, " ")};;;;` : "",
    lead.notes ? `NOTE:${lead.notes.replace(/\n/g, " ")}` : "",
    "END:VCARD",
  ].filter(Boolean).join("\r\n");

  const filename = `${lead.name || "contact"}.vcf`;

  return new Response(vcf, {
    headers: {
      "Content-Type": "text/x-vcard; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
