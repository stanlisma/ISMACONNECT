"use client";

import { ImagePlus, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { setTypingAction } from "@/lib/actions/typing";
import { FieldHelp } from "@/components/ui/field-help";

interface MessageComposerProps {
  conversationId: string;
  ariaLabel?: string;
  disabled?: boolean;
  disabledMessage?: string | null;
  placeholder?: string;
}

export function MessageComposer({
  conversationId,
  ariaLabel = "Message",
  disabled = false,
  disabledMessage,
  placeholder
}: MessageComposerProps) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);
  const [imageUrl, setImageUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      if (!disabled) {
        void setTypingAction(conversationId, false);
      }

      isTypingRef.current = false;
    };
  }, [conversationId, disabled]);

  function handleTyping() {
    if (disabled) {
      return;
    }

    if (!isTypingRef.current) {
      isTypingRef.current = true;
      void setTypingAction(conversationId, true);
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;
      void setTypingAction(conversationId, false);
    }, 1200);
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || disabled) return;

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
      event.target.value = "";
    }
  }

  return (
    <div className="message-composer">
      <textarea
        className="input message-composer-textarea"
        name="body"
        rows={4}
        aria-label={ariaLabel}
        placeholder={
          disabled
            ? disabledMessage ?? "Messaging is disabled for this conversation."
            : placeholder ?? "Ask a question or confirm details..."
        }
        onChange={handleTyping}
        onBlur={() => {
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
          }

          if (!disabled) {
            void setTypingAction(conversationId, false);
          }

          isTypingRef.current = false;
        }}
        disabled={disabled}
      />

      <div className="message-composer-toolbar">
        <label className={`message-composer-upload ${disabled ? "is-disabled" : ""}`}>
          <ImagePlus aria-hidden="true" size={16} strokeWidth={2.2} />
          <span>{isUploading ? "Uploading image..." : "Attach image"}</span>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={isUploading || disabled}
          />
        </label>

        {!disabled ? (
          <span className="message-composer-help">
            <FieldHelp
              label="Attach image"
              text="Add a photo if it helps explain the listing, condition, or pickup details faster."
            />
          </span>
        ) : null}
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
