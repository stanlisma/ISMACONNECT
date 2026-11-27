"use client";

import { Bold, Italic, List } from "lucide-react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

import { parseDescriptionMarkdown, serializeDescriptionDoc } from "@/lib/listing-description-doc";

// Only the formatting FormattedText knows how to render on the public
// listing page (bold, italic, bullet/numbered lists, line breaks) is enabled
// here - headings, links, code, and raw HTML are switched off rather than
// left to be stripped later.
const EXTENSIONS = [
  StarterKit.configure({
    blockquote: false,
    code: false,
    codeBlock: false,
    heading: false,
    horizontalRule: false,
    link: false,
    strike: false,
    underline: false
  })
];

export function DescriptionRichEditor({
  name,
  value,
  onChange
}: {
  name: string;
  value: string;
  onChange: (value: string) => void;
}) {
  // `content` seeds the editor once, on mount - the editor owns its own
  // document after that, and `onChange` is the only path back to the
  // parent's state, so there is no reactive sync to keep here.
  const editor = useEditor({
    extensions: EXTENSIONS,
    content: parseDescriptionMarkdown(value),
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(serializeDescriptionDoc(editor.getJSON()));
    }
  });

  return (
    <div className="description-rich-editor">
      <div className="description-toolbar">
        <button
          type="button"
          className={`description-toolbar-button${editor?.isActive("bold") ? " is-active" : ""}`}
          aria-label="Bold"
          title="Bold"
          onClick={() => editor?.chain().focus().toggleBold().run()}
        >
          <Bold size={16} />
        </button>
        <button
          type="button"
          className={`description-toolbar-button${editor?.isActive("italic") ? " is-active" : ""}`}
          aria-label="Italic"
          title="Italic"
          onClick={() => editor?.chain().focus().toggleItalic().run()}
        >
          <Italic size={16} />
        </button>
        <button
          type="button"
          className={`description-toolbar-button${editor?.isActive("bulletList") ? " is-active" : ""}`}
          aria-label="Bullet list"
          title="Bullet list"
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
        >
          <List size={16} />
        </button>
      </div>

      <EditorContent editor={editor} className="input description-rich-editor-content" />

      <input type="hidden" name={name} value={value} />
    </div>
  );
}
