import { NextResponse } from "next/server";

const ELEVENLABS_STT = "https://api.elevenlabs.io/v1/speech-to-text";

export async function POST(request: Request) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ELEVENLABS_API_KEY not configured" },
      { status: 500 }
    );
  }
  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "file required" }, { status: 400 });
  }

  const body = new FormData();
  body.append("file", file);

  const res = await fetch(ELEVENLABS_STT, {
    method: "POST",
    headers: { "xi-api-key": apiKey },
    body,
  });

  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json(
      { error: "ElevenLabs STT failed", detail: err },
      { status: res.status }
    );
  }

  const data = (await res.json()) as { text?: string };
  return NextResponse.json({ text: data.text ?? "" });
}
