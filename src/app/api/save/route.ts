import { NextRequest } from "next/server";
import { google } from "googleapis";

function getAuth() {
  return new google.auth.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

export async function POST(req: NextRequest) {
  try {
    const { lead, image } = await req.json();

    const auth = getAuth();
    const sheets = google.sheets({ version: "v4", auth });

    const timestamp = new Date().toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
    });

    const imageUrl = image ? "Captured (stored locally)" : "";

    const row = [
      timestamp,
      lead.name || "",
      lead.phone || "",
      lead.email || "",
      lead.company || "",
      lead.designation || "",
      lead.website || "",
      lead.address || "",
      lead.notes || "",
      process.env.EXHIBITION_NAME || "Default",
      imageUrl,
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: "Sheet1!A:K",
      valueInputOption: "RAW",
      requestBody: { values: [row] },
    });

    return Response.json({ ok: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Save error:", msg);
    return Response.json({ error: msg }, { status: 500 });
  }
}
