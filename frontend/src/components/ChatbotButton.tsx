import { useEffect, useRef, useState } from "react";

/**
 * Floating "AI helper" button, a placeholder for a future chat assistant.
 * Hover or keyboard focus shows "Coming soon"; a tap (phones have no hover) toggles it.
 */
export default function ChatbotButton() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // A tap elsewhere closes the note again.
  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);

  return (
    <div className={`chatbot${open ? " open" : ""}`} ref={ref}>
      <div className="chatbot-tip" role="tooltip" id="chatbot-tip">
        <strong>AI farm helper</strong>
        <span>Coming soon</span>
      </div>
      <button
        type="button"
        className="chatbot-btn"
        aria-label="AI farm helper, coming soon"
        aria-describedby="chatbot-tip"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <svg viewBox="0 0 48 48" width="34" height="34" aria-hidden="true">
          <path
            d="M24 6C13.5 6 5 13.2 5 22c0 4.6 2.3 8.7 6 11.6V42l8.2-4.6c1.5.3 3.1.5 4.8.5 10.5 0 19-7.2 19-16S34.5 6 24 6z"
            fill="currentColor"
          />
          <circle cx="15.5" cy="22" r="2.8" fill="var(--accent)" />
          <circle cx="24" cy="22" r="2.8" fill="var(--accent)" />
          <circle cx="32.5" cy="22" r="2.8" fill="var(--accent)" />
        </svg>
        <span className="chatbot-badge" aria-hidden="true">AI</span>
      </button>
    </div>
  );
}
