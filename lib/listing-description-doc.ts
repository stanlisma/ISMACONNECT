import type { JSONContent } from "@tiptap/core";
import { toMarkdown } from "mdast-util-to-markdown";
import { toString as mdastToString } from "mdast-util-to-string";
import remarkParse from "remark-parse";
import remarkBreaks from "remark-breaks";
import { unified } from "unified";

// Converts between the plain-markdown string we store for a listing
// description (unchanged since the earlier line-break/formatting fixes) and
// the rich-text editor's document model. Parsing goes through the same
// remark + remark-breaks pipeline FormattedText renders with, so a single
// newline is always treated as a line break the same way in both the editor
// and the public listing page. Only a narrow, known subset of markdown is
// supported (paragraphs, bold, italic, bullet/numbered lists, line breaks);
// anything else (headings, links, code, raw HTML, ...) is flattened to plain
// text rather than dropped, matching FormattedText's "unwrap, don't render"
// behavior for unsupported syntax.

const markdownProcessor = unified().use(remarkParse).use(remarkBreaks);

function mdastInlineToDocInline(nodes: any[], marks: string[] = []): JSONContent[] {
  const out: JSONContent[] = [];

  for (const node of nodes) {
    if (node.type === "text") {
      if (node.value.length > 0) {
        out.push({
          type: "text",
          text: node.value,
          ...(marks.length ? { marks: marks.map((type) => ({ type })) } : {})
        });
      }
    } else if (node.type === "strong") {
      out.push(...mdastInlineToDocInline(node.children, [...marks, "bold"]));
    } else if (node.type === "emphasis") {
      out.push(...mdastInlineToDocInline(node.children, [...marks, "italic"]));
    } else if (node.type === "break") {
      out.push({ type: "hardBreak" });
    } else {
      // Unsupported inline syntax (links, code spans, images, raw html, ...):
      // keep the visible text rather than dropping it.
      const text = mdastToString(node);
      if (text) {
        out.push({
          type: "text",
          text,
          ...(marks.length ? { marks: marks.map((type) => ({ type })) } : {})
        });
      }
    }
  }

  return out;
}

function mdastBlockToDocBlocks(nodes: any[]): JSONContent[] {
  const out: JSONContent[] = [];

  for (const node of nodes) {
    if (node.type === "paragraph") {
      const content = mdastInlineToDocInline(node.children);
      out.push(content.length ? { type: "paragraph", content } : { type: "paragraph" });
    } else if (node.type === "list") {
      const items = node.children.map((item: any) => ({
        type: "listItem",
        content: mdastBlockToDocBlocks(item.children.length ? item.children : [{ type: "paragraph", children: [] }])
      }));
      out.push({ type: node.ordered ? "orderedList" : "bulletList", content: items });
    } else {
      // Unsupported block syntax (headings, blockquotes, code blocks, ...):
      // keep the visible text as a plain paragraph rather than dropping it.
      const text = mdastToString(node);
      if (text) {
        out.push({ type: "paragraph", content: [{ type: "text", text }] });
      }
    }
  }

  return out;
}

export function parseDescriptionMarkdown(markdown: string): JSONContent {
  const tree = markdownProcessor.parse(markdown);
  const blocks = mdastBlockToDocBlocks((tree as any).children);
  return { type: "doc", content: blocks.length ? blocks : [{ type: "paragraph" }] };
}

function docInlineToMdast(nodes: JSONContent[] | undefined): any[] {
  const out: any[] = [];

  for (const node of nodes ?? []) {
    if (node.type === "hardBreak") {
      out.push({ type: "break" });
      continue;
    }

    if (node.type === "text" && node.text) {
      let mdastNode: any = { type: "text", value: node.text };
      const marks = (node.marks ?? []).map((mark) => mark.type);

      if (marks.includes("italic")) {
        mdastNode = { type: "emphasis", children: [mdastNode] };
      }
      if (marks.includes("bold")) {
        mdastNode = { type: "strong", children: [mdastNode] };
      }

      out.push(mdastNode);
    }
  }

  return out;
}

function docBlocksToMdast(nodes: JSONContent[] | undefined): any[] {
  const out: any[] = [];

  for (const node of nodes ?? []) {
    if (node.type === "paragraph") {
      out.push({ type: "paragraph", children: docInlineToMdast(node.content) });
    } else if (node.type === "bulletList" || node.type === "orderedList") {
      out.push({
        type: "list",
        ordered: node.type === "orderedList",
        spread: false,
        children: (node.content ?? []).map((item) => ({
          type: "listItem",
          spread: false,
          children: docBlocksToMdast(item.content)
        }))
      });
    }
  }

  return out;
}

export function serializeDescriptionDoc(doc: JSONContent): string {
  const tree = { type: "root", children: docBlocksToMdast(doc.content) };
  return toMarkdown(tree as any, { bullet: "-", emphasis: "*", strong: "*" }).trim();
}
