"use client";

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
    <div style={{ display: "grid", gap: "0.75rem" }}>
      <textarea
        className="input"
        name="body"
        rows={4}
        placeholder="Type your message..."
        onChange={handleTyping}
      />

      <div>
        <span className="field-label">Upload image (optional)</span>
        <input
          className="input"
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          style={{ marginTop: "0.5rem" }}
        />

        {isUploading ? <p style={{ marginTop: "0.5rem" }}>Uploading image...</p> : null}
        {uploadError ? <p style={{ marginTop: "0.5rem", color: "#b42318" }}>{uploadError}</p> : null}
      </div>

      <input type="hidden" name="imageUrl" value={imageUrl} />

      {imageUrl ? (
        <div>
          <span className="field-label">Preview</span>
          <div style={{ marginTop: "0.5rem" }}>
            <img
              src={imageUrl}
              alt="Message attachment preview"
              style={{
                width: "100%",
                maxWidth: "240px",
                borderRadius: "12px",
                border: "1px solid #d0d5dd"
              }}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}