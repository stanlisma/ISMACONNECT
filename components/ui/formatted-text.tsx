import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";

// Renders user-typed descriptions with a small set of safe formatting:
// bold, italic, and bullet/numbered lists. Raw HTML is never parsed (no
// rehype-raw plugin), so this is safe to use directly on untrusted text.
const ALLOWED_ELEMENTS = ["p", "strong", "em", "ul", "ol", "li", "br"];

export function FormattedText({ text, className }: { text: string; className?: string }) {
  return (
    <div className={className}>
      <ReactMarkdown allowedElements={ALLOWED_ELEMENTS} unwrapDisallowed remarkPlugins={[remarkBreaks]}>
        {text}
      </ReactMarkdown>
    </div>
  );
}
