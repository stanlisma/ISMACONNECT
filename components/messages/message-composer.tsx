"use client";

import { useRef } from "react";

import { setTypingAction } from "@/lib/actions/typing";

export function MessageComposer({ conversationId }: { conversationId: string }) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function handleTyping() {
    await setTypingAction(conversationId, true);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(async () => {
      await setTypingAction(conversationId, false);
    }, 1200);
  }

  return (
    <textarea
      className="input"
      id="message-body"
      name="body"
      rows={4}
      placeholder="Type your message..."
      onChange={handleTyping}
    />
  );
}