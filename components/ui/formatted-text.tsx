import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";

const ALLOWED_ELEMENTS = ["p", "strong", "em", "ul", "ol", "li", "br"];

export function FormattedText({ text, className }: { text: string; className?: string }) {
  return (
    <div className={className}>
      <ReactMarkdown
        allowedElements={ALLOWED_ELEMENTS}
        unwrapDisallowed
        remarkPlugins={[remarkBreaks]}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}
