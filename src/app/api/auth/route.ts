import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const { password } = await req.json();

  if (password === process.env.APP_PASSWORD) {
    return Response.json({ ok: true });
  }

  return Response.json({ error: "Invalid password" }, { status: 401 });
}
