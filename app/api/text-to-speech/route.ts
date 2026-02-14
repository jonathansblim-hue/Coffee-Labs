import { NextResponse } from "next/server";

const DEFAULT_VOICE_ID = "21m00Tcm4TlvDq8ikWAM"; // Rachel
const ELEVENLABS_TTS = (voiceId: string) =>
  `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;

export async function POST(request: Request) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ELEVENLABS_API_KEY not configured" },
      { status: 500 }
    );
  }
  const { text } = (await request.json()) as { text?: string };
  if (!text || typeof text !== "string") {
    return NextResponse.json({ error: "text required" }, { status: 400 });
  }
  const voiceId = process.env.ELEVENLABS_VOICE_ID ?? DEFAULT_VOICE_ID;

  const res = await fetch(ELEVENLABS_TTS(voiceId), {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text: text.slice(0, 2500),
      model_id: "eleven_monolingual_v1",
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json(
      { error: "ElevenLabs TTS failed", detail: err },
      { status: res.status }
    );
  }

  const audioBuffer = await res.arrayBuffer();
  return new NextResponse(audioBuffer, {
    headers: {
      "Content-Type": "audio/mpeg",
    },
  });
}
