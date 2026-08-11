export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { submitFeedback } from "@/lib/feedback";
import { FeedbackType } from "@/types";

const VALID_TYPES: FeedbackType[] = ["bug", "feature", "other"];
const MAX_MESSAGE_LENGTH = 2000;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null) as
    | { type?: string; message?: string; sessionId?: string }
    | null;

  const type = body?.type;
  const message = body?.message?.trim();

  if (!type || !VALID_TYPES.includes(type as FeedbackType)) {
    return NextResponse.json({ error: "Invalid feedback type" }, { status: 400 });
  }
  if (!message || message.length === 0 || message.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json({ error: "Invalid message" }, { status: 400 });
  }

  const feedback = await submitFeedback({
    type: type as FeedbackType,
    message,
    sessionId: body?.sessionId,
  });

  return NextResponse.json({ id: feedback.id });
}
