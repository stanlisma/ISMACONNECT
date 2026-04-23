import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

export async function sendNewMessageEmail(args: {
  to: string;
  recipientName?: string | null;
  senderName: string;
  listingTitle: string;
  conversationUrl: string;
  messagePreview: string;
}) {
  const from = requireEnv("EMAIL_FROM");

  const greeting = args.recipientName?.trim() || "there";

  const subject = `New message about "${args.listingTitle}"`;

  const html = `
    <div style="font-family: Arial, sans-serif; color: #15365b; line-height: 1.6;">
      <h2 style="margin-bottom: 8px;">You have a new message on ISMACONNECT</h2>
      <p>Hello ${greeting},</p>
      <p><strong>${args.senderName}</strong> sent you a message about <strong>${args.listingTitle}</strong>.</p>
      <div style="padding: 12px 14px; background: #f3f8ff; border: 1px solid #d5e4fb; border-radius: 10px; margin: 16px 0;">
        ${args.messagePreview}
      </div>
      <p>
        <a href="${args.conversationUrl}" style="display:inline-block;padding:10px 16px;background:#006fd6;color:#fff;text-decoration:none;border-radius:999px;font-weight:700;">
          Open conversation
        </a>
      </p>
      <p style="color:#57769c;">If the button does not work, copy and paste this link into your browser:</p>
      <p style="color:#57769c;">${args.conversationUrl}</p>
    </div>
  `;

  const text = `You have a new message on ISMACONNECT

${args.senderName} sent you a message about "${args.listingTitle}".

Message preview:
${args.messagePreview}

Open conversation:
${args.conversationUrl}
`;

  const { error } = await resend.emails.send({
    from,
    to: [args.to],
    subject,
    html,
    text
  });

  if (error) {
    throw new Error(error.message);
  }
}