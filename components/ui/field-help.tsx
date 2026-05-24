"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

type FieldHelpProps = {
  text: string;
  label?: string;
};

type FloatingPopoverPosition = {
  left: number;
  maxHeight: number;
  top: number;
  width: number;
};

export function FieldHelp({ text, label = "Help" }: FieldHelpProps) {
  const helpId = useId();
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<FloatingPopoverPosition | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setPosition(null);
      return;
    }

    const updatePosition = () => {
      const trigger = triggerRef.current;
      const popover = popoverRef.current;

      if (!trigger || !popover) {
        return;
      }

      const rect = trigger.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const isMobileViewport = viewportWidth <= 760;
      const horizontalPadding = isMobileViewport ? 12 : 16;
      const width = Math.min(
        isMobileViewport ? viewportWidth - horizontalPadding * 2 : 288,
        viewportWidth - horizontalPadding * 2
      );

      popover.style.width = `${width}px`;

      const measuredHeight = popover.offsetHeight || 140;
      const spaceBelow = viewportHeight - rect.bottom - 12;
      const spaceAbove = rect.top - 12;
      const useTopPlacement = spaceBelow < measuredHeight && spaceAbove > spaceBelow;
      const left = Math.min(
        Math.max(isMobileViewport ? (viewportWidth - width) / 2 : rect.left, horizontalPadding),
        viewportWidth - width - horizontalPadding
      );
      const top = useTopPlacement
        ? Math.max(12, rect.top - measuredHeight - 10)
        : Math.min(rect.bottom + 10, viewportHeight - measuredHeight - 12);

      setPosition({
        left,
        top,
        width,
        maxHeight: Math.max(120, viewportHeight - 24)
      });
    };

    const animationFrame = window.requestAnimationFrame(updatePosition);
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const popover = isMounted && isOpen
    ? createPortal(
        <>
          <button
            type="button"
            className="field-help-overlay"
            aria-label={`Close ${label} help`}
            onClick={() => setIsOpen(false)}
          />
          <div
            ref={popoverRef}
            id={helpId}
            className="field-help-popover field-help-popover-floating"
            role="note"
            style={
              position
                ? {
                    left: `${position.left}px`,
                    top: `${position.top}px`,
                    width: `${position.width}px`,
                    maxHeight: `${position.maxHeight}px`
                  }
                : {
                    visibility: "hidden"
                  }
            }
          >
            {text}
          </div>
        </>,
        document.body
      )
    : null;

  return (
    <>
      <span className={`field-help${isOpen ? " is-open" : ""}`}>
        <button
          ref={triggerRef}
          type="button"
          className="field-help-badge"
          aria-controls={helpId}
          aria-expanded={isOpen}
          aria-label={`${label}: ${text}`}
          onClick={() => setIsOpen((current) => !current)}
        >
          <span aria-hidden="true">?</span>
        </button>
      </span>
      {popover}
    </>
  );
}

export function FieldLabelWithHelp({
  label,
  helpText
}: {
  label: string;
  helpText?: string | null;
}) {
  return (
    <span className="field-label-row">
      <span className="field-label">{label}</span>
      {helpText ? <FieldHelp text={helpText} label={label} /> : null}
    </span>
  );
}
