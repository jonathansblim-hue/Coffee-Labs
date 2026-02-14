"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";

type Message = { role: "user" | "assistant"; content: string };

export default function CustomerPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hi! Welcome to NYC Coffee. What can I get you today? You can order by voice or type here.",
    },
  ]);
  const [input, setInput] = useState("");
  const [voiceMode, setVoiceMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || loading) return;
      setMessages((m) => [...m, { role: "user", content: trimmed }]);
      setInput("");
      setLoading(true);
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [...messages, { role: "user", content: trimmed }].map(
              (m) => ({ role: m.role, content: m.content })
            ),
          }),
        });
        const raw = await res.text();
        let data: { message?: string; error?: string };
        try {
          data = JSON.parse(raw) as { message?: string; error?: string };
        } catch {
          setMessages((m) => [
            ...m,
            { role: "assistant", content: `Sorry, the cashier returned an invalid response (${res.status}). Check that GOOGLE_GENAI_API_KEY is set and try again.` },
          ]);
          return;
        }
        if (!res.ok) {
          const errMsg = data.error || "Request failed";
          setMessages((m) => [
            ...m,
            { role: "assistant", content: `Sorry, the cashier isn’t responding: ${errMsg}. If you’re on the live site, check that GOOGLE_GENAI_API_KEY is set in Railway.` },
          ]);
          return;
        }
        setMessages((m) => [
          ...m,
          { role: "assistant", content: data.message ?? "Something went wrong." },
        ]);
        if (voiceMode && data.message) {
          try {
            const ttsRes = await fetch("/api/text-to-speech", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ text: data.message }),
            });
            if (ttsRes.ok) {
              const blob = await ttsRes.blob();
              const url = URL.createObjectURL(blob);
              const audio = new Audio(url);
              await audio.play();
              URL.revokeObjectURL(url);
            }
          } catch {
            // TTS optional
          }
        }
      } catch (e) {
        const errMsg = e instanceof Error ? e.message : "Network or server error";
        setMessages((m) => [
          ...m,
          {
            role: "assistant",
            content: `Sorry, something went wrong: ${errMsg}. Try again or check your connection. If the problem continues, check that GOOGLE_GENAI_API_KEY is set.`,
          },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [messages, loading, voiceMode]
  );

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size) chunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        if (chunksRef.current.length === 0) return;
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const form = new FormData();
        form.append("file", blob, "audio.webm");
        setLoading(true);
        try {
          const sttRes = await fetch("/api/speech-to-text", {
            method: "POST",
            body: form,
          });
          const sttData = (await sttRes.json()) as { text?: string };
          const text = (sttData.text ?? "").trim();
          if (text) await sendMessage(text);
        } catch {
          setMessages((m) => [
            ...m,
            { role: "assistant", content: "Couldn’t hear that. Try again or type." },
          ]);
        } finally {
          setLoading(false);
        }
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecording(true);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "Microphone access needed for voice. You can type instead." },
      ]);
    }
  }, [sendMessage]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
      setRecording(false);
    }
  }, [recording]);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-[var(--card)] flex-shrink-0">
          <Image
            src="/Coffee Menu.png"
            alt="NYC Coffee"
            fill
            className="object-cover"
            priority
          />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-[var(--accent)]">
            Order with the AI Cashier
          </h1>
          <p className="text-neutral-400 text-sm mt-1">
            Talk or type. We’ll ask for size, temp, and any customizations.
          </p>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <button
          type="button"
          onClick={() => setVoiceMode(false)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            !voiceMode
              ? "bg-[var(--accent)] text-black"
              : "bg-[var(--card)] text-neutral-400 hover:text-white"
          }`}
        >
          Text
        </button>
        <button
          type="button"
          onClick={() => setVoiceMode(true)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            voiceMode
              ? "bg-[var(--accent)] text-black"
              : "bg-[var(--card)] text-neutral-400 hover:text-white"
          }`}
        >
          Voice
        </button>
      </div>

      <div className="bg-[var(--card)] rounded-2xl border border-white/5 min-h-[320px] flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                  msg.role === "user"
                    ? "bg-[var(--accent)] text-black"
                    : "bg-white/10 text-neutral-200"
                }`}
              >
                <div className="whitespace-pre-wrap text-sm">{msg.content}</div>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-white/10 rounded-2xl px-4 py-2.5 text-neutral-400 text-sm">
                ...
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-white/5 flex gap-2">
          {voiceMode ? (
            <>
              {!recording ? (
                <button
                  type="button"
                  onClick={startRecording}
                  disabled={loading}
                  className="flex-1 py-3 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 font-medium transition disabled:opacity-50"
                >
                  Hold to talk
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopRecording}
                  className="flex-1 py-3 rounded-xl bg-red-500/30 text-red-300 font-medium"
                >
                  Release to send
                </button>
              )}
            </>
          ) : (
            <>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
                placeholder="Type your order..."
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => sendMessage(input)}
                disabled={loading || !input.trim()}
                className="px-5 py-3 rounded-xl bg-[var(--accent)] text-black font-medium disabled:opacity-50 hover:opacity-90 transition"
              >
                Send
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
