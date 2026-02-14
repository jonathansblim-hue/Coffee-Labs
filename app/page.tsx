"use client";

import { useState, useRef, useCallback, useEffect } from "react";

type Message = { role: "user" | "assistant"; content: string };

/* ---------- helpers ---------- */

function isReceipt(text: string) {
  return text.startsWith("Order placed!");
}

function ReceiptBubble({ text }: { text: string }) {
  const lines = text.split("\n").filter(Boolean);
  const header = lines[0]; // "Order placed! Receipt #XXXXXXXX"
  const totalLine = lines.find((l) => l.includes("**Total:"));
  const total = totalLine?.replace(/\*\*/g, "").replace("Total:", "").trim() ?? "";
  const itemLines = lines.filter((l) => l.startsWith("•"));
  const footer = lines[lines.length - 1];

  return (
    <div className="receipt-card max-w-[90%] animate-slide-up">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-green-400 text-lg">✓</span>
        <span className="font-semibold text-green-400 text-sm">{header}</span>
      </div>
      <div className="space-y-1.5 mb-3">
        {itemLines.map((line, i) => (
          <div key={i} className="flex justify-between gap-4 text-sm">
            <span className="text-neutral-300">{line.replace("•", "").replace(/— \$[\d.]+$/, "").trim()}</span>
            <span className="text-[var(--accent)] tabular-nums whitespace-nowrap">
              {line.match(/\$[\d.]+$/)?.[0] ?? ""}
            </span>
          </div>
        ))}
      </div>
      <div className="border-t border-white/10 pt-2 flex justify-between items-center">
        <span className="text-sm font-medium text-neutral-300">Total</span>
        <span className="text-[var(--accent)] font-bold text-base">{total}</span>
      </div>
      {footer && !footer.includes("Total") && (
        <p className="text-xs text-neutral-500 mt-2">{footer}</p>
      )}
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex justify-start animate-fade-in">
      <div className="bg-white/[0.06] border border-white/[0.04] rounded-2xl px-4 py-3 flex gap-1.5">
        <span className="w-2 h-2 bg-neutral-400 rounded-full animate-pulse-dot" style={{ animationDelay: "0ms" }} />
        <span className="w-2 h-2 bg-neutral-400 rounded-full animate-pulse-dot" style={{ animationDelay: "200ms" }} />
        <span className="w-2 h-2 bg-neutral-400 rounded-full animate-pulse-dot" style={{ animationDelay: "400ms" }} />
      </div>
    </div>
  );
}

/* ---------- page ---------- */

export default function CustomerPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hey there! Welcome to NYC Coffee ☕\n\nWhat can I get started for you? We've got coffee, tea, pastries, and plenty of ways to customize. You can type or switch to voice!",
    },
  ]);
  const [input, setInput] = useState("");
  const [voiceMode, setVoiceMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  /* auto-scroll to bottom */
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || loading) return;
      const newMessages: Message[] = [...messages, { role: "user", content: trimmed }];
      setMessages(newMessages);
      setInput("");
      setLoading(true);
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          }),
        });
        const raw = await res.text();
        let data: { message?: string; error?: string };
        try {
          data = JSON.parse(raw) as { message?: string; error?: string };
        } catch {
          setMessages((m) => [
            ...m,
            { role: "assistant", content: "Sorry, something went wrong with the cashier. Please try again." },
          ]);
          return;
        }
        if (!res.ok) {
          const errMsg = data.error || "Request failed";
          setMessages((m) => [
            ...m,
            { role: "assistant", content: `Sorry, the cashier isn't responding right now: ${errMsg}` },
          ]);
          return;
        }
        setMessages((m) => [
          ...m,
          { role: "assistant", content: data.message ?? "Something went wrong." },
        ]);
        // TTS in voice mode
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
            // TTS is optional
          }
        }
      } catch (e) {
        const errMsg = e instanceof Error ? e.message : "Network error";
        setMessages((m) => [
          ...m,
          { role: "assistant", content: `Connection error: ${errMsg}. Please try again.` },
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
          else {
            setMessages((m) => [
              ...m,
              { role: "assistant", content: "I didn't catch that. Could you try again?" },
            ]);
            setLoading(false);
          }
        } catch {
          setMessages((m) => [
            ...m,
            { role: "assistant", content: "Couldn't process the audio. You can type instead!" },
          ]);
          setLoading(false);
        }
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecording(true);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "Microphone access is needed for voice ordering. You can type your order below!" },
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
    <div className="max-w-2xl mx-auto flex flex-col" style={{ height: "calc(100vh - 80px)" }}>
      {/* Header */}
      <div className="flex items-center gap-4 mb-4 flex-shrink-0">
        <div className="w-12 h-12 rounded-xl bg-[var(--accent)]/15 flex items-center justify-center text-2xl flex-shrink-0">
          ☕
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-semibold text-[var(--foreground)]">
            AI Cashier
          </h1>
          <p className="text-neutral-500 text-xs">
            NYC Coffee · 512 W 43rd St
          </p>
        </div>
        {/* Voice / Text toggle */}
        <div className="flex bg-[var(--card)] border border-[var(--border)] rounded-lg p-0.5">
          <button
            type="button"
            onClick={() => setVoiceMode(false)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              !voiceMode
                ? "bg-[var(--accent)] text-black shadow-sm"
                : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            Text
          </button>
          <button
            type="button"
            onClick={() => setVoiceMode(true)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              voiceMode
                ? "bg-[var(--accent)] text-black shadow-sm"
                : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            Voice
          </button>
        </div>
      </div>

      {/* Chat area */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto rounded-2xl bg-[var(--card)] border border-[var(--border)] mb-3"
      >
        <div className="p-4 space-y-3 min-h-full flex flex-col justify-end">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-fade-in`}
            >
              {msg.role === "assistant" && isReceipt(msg.content) ? (
                <ReceiptBubble text={msg.content} />
              ) : (
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-[var(--accent)] text-black rounded-br-md"
                      : "bg-white/[0.06] text-neutral-200 border border-white/[0.04] rounded-bl-md"
                  }`}
                >
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                </div>
              )}
            </div>
          ))}
          {loading && <TypingIndicator />}
          <div ref={chatEndRef} />
        </div>
      </div>

      {/* Input area */}
      <div className="flex-shrink-0 pb-2">
        {voiceMode ? (
          <button
            type="button"
            onMouseDown={startRecording}
            onMouseUp={stopRecording}
            onTouchStart={startRecording}
            onTouchEnd={stopRecording}
            disabled={loading}
            className={`w-full py-4 rounded-2xl font-medium transition-all text-sm ${
              recording
                ? "bg-red-500/25 text-red-300 border-2 border-red-500/40 scale-[0.98]"
                : "bg-[var(--card)] border-2 border-[var(--border)] text-neutral-300 hover:border-red-500/30 hover:text-red-400"
            } disabled:opacity-50`}
          >
            {recording ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-3 h-3 bg-red-400 rounded-full animate-pulse" />
                Recording... release to send
              </span>
            ) : (
              "🎙 Hold to talk"
            )}
          </button>
        ) : (
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
              placeholder="Type your order..."
              className="flex-1 bg-[var(--card)] border border-[var(--border)] rounded-2xl px-4 py-3 text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 focus:border-[var(--accent)]/30 transition"
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => sendMessage(input)}
              disabled={loading || !input.trim()}
              className="px-5 py-3 rounded-2xl bg-[var(--accent)] text-black text-sm font-semibold disabled:opacity-40 hover:brightness-110 active:scale-95 transition-all"
            >
              Send
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
