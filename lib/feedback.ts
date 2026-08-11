import { Feedback, FeedbackType } from "@/types";
import { localKV } from "@/lib/session";

const MAX_MESSAGE_LENGTH = 2000;
const FEEDBACK_TTL_SECONDS = 90 * 24 * 60 * 60; // 90 days

async function getKV(): Promise<KVNamespace> {
  if (process.env.KV_STORE === "memory") return localKV;
  const { getRequestContext } = await import("@cloudflare/next-on-pages");
  return getRequestContext().env.QUEUE_KV;
}

function feedbackKey(id: string) {
  return `feedback:${id}`;
}

async function notifyDiscord(feedback: Feedback): Promise<void> {
  const webhookUrl = process.env.DISCORD_FEEDBACK_WEBHOOK_URL;
  if (!webhookUrl) return;
  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: `**New feedback (${feedback.type})**\n${feedback.message}`,
      }),
    });
  } catch {
    // Notification failures must never affect the caller.
  }
}

export async function submitFeedback(input: {
  type: FeedbackType;
  message: string;
  sessionId?: string;
}): Promise<Feedback> {
  const now = Date.now();
  const feedback: Feedback = {
    id: `${now}-${crypto.randomUUID()}`,
    type: input.type,
    message: input.message.slice(0, MAX_MESSAGE_LENGTH),
    createdAt: now,
    ...(input.sessionId ? { sessionId: input.sessionId } : {}),
  };

  const kv = await getKV();
  await kv.put(feedbackKey(feedback.id), JSON.stringify(feedback), {
    expirationTtl: FEEDBACK_TTL_SECONDS,
  });

  await notifyDiscord(feedback);

  return feedback;
}
