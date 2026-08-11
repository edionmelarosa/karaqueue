"use client";

import { useState } from "react";
import { FeedbackType } from "@/types";

const TYPES: { value: FeedbackType; label: string }[] = [
  { value: "bug", label: "Bug" },
  { value: "feature", label: "Feature" },
  { value: "other", label: "Other" },
];

export default function FeedbackWidget({ sessionId }: { sessionId?: string }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<FeedbackType>("bug");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

  function reset() {
    setType("bug");
    setMessage("");
    setStatus("idle");
  }

  function close() {
    setOpen(false);
    reset();
  }

  async function handleSubmit() {
    if (!message.trim() || status === "submitting") return;
    setStatus("submitting");
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, message: message.trim(), sessionId }),
      });
      if (!res.ok) throw new Error("Failed to submit feedback");
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Send feedback"
        className="fixed bottom-4 right-4 z-50 w-12 h-12 rounded-full bg-cyan-500/20 border border-cyan-700/60 hover:bg-cyan-500/30 hover:border-cyan-500 transition-colors flex items-center justify-center shadow-[0_0_16px_#00d4ff30]"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-400" aria-hidden="true">
          <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
        </svg>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={close}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-gray-700/60 bg-[#0a0a0f] p-5 flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-white font-semibold text-sm">Send feedback</h2>
              <button
                onClick={close}
                aria-label="Close"
                className="text-gray-500 hover:text-gray-300 transition-colors"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {status === "success" ? (
              <p className="text-cyan-400 text-sm text-center py-4">
                Thanks! Your feedback has been sent.
              </p>
            ) : (
              <>
                <div className="flex gap-2">
                  {TYPES.map((t) => (
                    <button
                      key={t.value}
                      onClick={() => setType(t.value)}
                      className={`flex-1 py-2 rounded-xl text-xs font-medium transition-colors border ${
                        type === t.value
                          ? "bg-cyan-500/20 border-cyan-600 text-cyan-300"
                          : "bg-gray-900/40 border-gray-700/60 text-gray-400 hover:border-gray-600"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="What's on your mind?"
                  maxLength={2000}
                  rows={4}
                  className="w-full bg-gray-900/40 border border-gray-700/60 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-700 resize-none"
                />

                {status === "error" && (
                  <p className="text-red-400 text-xs text-center">
                    Something went wrong. Please try again.
                  </p>
                )}

                <button
                  onClick={handleSubmit}
                  disabled={!message.trim() || status === "submitting"}
                  className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 active:bg-cyan-600 transition-colors text-black text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {status === "submitting" ? "Sending…" : "Send"}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
