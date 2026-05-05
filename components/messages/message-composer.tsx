"use client";

import { ImagePlus, X } from "lucide-react";
import { useRef, useState } from "react";

import { setTypingAction } from "@/lib/actions/typing";

export function MessageComposer({ conversationId }: { conversationId: string }) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  async function handleTyping() {
    await setTypingAction(conversationId, true);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(async () => {
      await setTypingAction(conversationId, false);
    }, 1200);
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadError("");
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload-message", {
        method: "POST",
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Upload failed.");
      }

      setImageUrl(data.url);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="message-composer">
      <textarea
        className="input message-composer-textarea"
        name="body"
        rows={5}
        placeholder="Ask a question, confirm pickup details, or send a quick update…"
        onChange={handleTyping}
      />

      <div className="message-composer-toolbar">
        <label className="message-composer-upload">
          <ImagePlus aria-hidden="true" size={16} strokeWidth={2.2} />
          <span>{isUploading ? "Uploading image…" : "Attach image"}</span>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={isUploading}
          />
        </label>

        <span className="message-composer-tip">Photos help with pickup, condition, and proof.</span>
      </div>

      {uploadError ? <p className="message-composer-error">{uploadError}</p> : null}

      <input type="hidden" name="imageUrl" value={imageUrl} />

      {imageUrl ? (
        <div className="message-composer-preview">
          <div className="message-composer-preview-head">
            <span className="field-label">Attachment preview</span>
            <button
              type="button"
              className="message-composer-clear"
              onClick={() => {
                setImageUrl("");
                setUploadError("");
              }}
            >
              <X aria-hidden="true" size={14} strokeWidth={2.4} />
              <span>Remove</span>
            </button>
          </div>

          <img
            src={imageUrl}
            alt="Message attachment preview"
            className="message-composer-preview-image"
          />
        </div>
      ) : null}
    </div>
  );
}
