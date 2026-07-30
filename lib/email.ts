import { Resend } from "resend";

import { getEmailEnv } from "@/lib/env";
import { SITE_SUPPORT_EMAIL } from "@/lib/constants";

// Names, message text, and other user-supplied strings get interpolated
// directly into these HTML email bodies - escape them so a crafted name or
// message can't inject markup/links into someone else's inbox.
function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function sendNewMessageEmail(args: {
  to: string;
  recipientName?: string | null;
  senderName: string;
  listingTitle: string;
  conversationUrl: string;
  messagePreview: string;
}) {
  const { resendApiKey, emailFrom } = getEmailEnv();
  const resend = new Resend(resendApiKey);

  const greeting = args.recipientName?.trim() || "there";
  const senderName = escapeHtml(args.senderName);
  const listingTitle = escapeHtml(args.listingTitle);
  const messagePreview = escapeHtml(args.messagePreview);

  const subject = `New message about "${args.listingTitle}"`;

  const html = `
    <div style="font-family: Arial, sans-serif; color: #15365b; line-height: 1.6;">
      <h2 style="margin-bottom: 8px;">You have a new message on ISMACONNECT</h2>
      <p>Hello ${escapeHtml(greeting)},</p>
      <p><strong>${senderName}</strong> sent you a message about <strong>${listingTitle}</strong>.</p>
      <div style="padding: 12px 14px; background: #f3f8ff; border: 1px solid #d5e4fb; border-radius: 10px; margin: 16px 0;">
        ${messagePreview}
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
    from: emailFrom,
    to: [args.to],
    subject,
    html,
    text
  });

  if (error) {
    throw new Error(error.message);
  }
}

function wrapEmailShell(bodyHtml: string) {
  return `
    <div style="font-family: Arial, sans-serif; color: #15365b; line-height: 1.6;">
      ${bodyHtml}
    </div>
  `;
}

async function sendAccountStatusEmail(args: {
  to: string;
  recipientName?: string | null;
  subject: string;
  html: string;
  text: string;
}) {
  const { resendApiKey, emailFrom } = getEmailEnv();
  const resend = new Resend(resendApiKey);

  const { error } = await resend.emails.send({
    from: emailFrom,
    to: [args.to],
    subject: args.subject,
    html: args.html,
    text: args.text
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function sendAccountDeactivatedEmail(args: { to: string; recipientName?: string | null }) {
  const greeting = args.recipientName?.trim() || "there";
  const subject = "Your ISMACONNECT account has been deactivated";

  await sendAccountStatusEmail({
    to: args.to,
    subject,
    html: wrapEmailShell(`
      <h2 style="margin-bottom: 8px;">Your account has been deactivated</h2>
      <p>Hello ${escapeHtml(greeting)},</p>
      <p>
        Your ISMACONNECT account, listings, and storefronts are now hidden from other users. Nothing was
        deleted — sign back in anytime to reactivate and pick up exactly where you left off.
      </p>
      <p>If you did not make this change, please contact us right away at admin@ismaconnect.ca.</p>
    `),
    text: `Your account has been deactivated

Hello ${greeting},

Your ISMACONNECT account, listings, and storefronts are now hidden from other users. Nothing was deleted —
sign back in anytime to reactivate and pick up exactly where you left off.

If you did not make this change, please contact us right away at admin@ismaconnect.ca.`
  });
}

export async function sendAccountReactivatedEmail(args: { to: string; recipientName?: string | null }) {
  const greeting = args.recipientName?.trim() || "there";
  const subject = "Your ISMACONNECT account is active again";

  await sendAccountStatusEmail({
    to: args.to,
    subject,
    html: wrapEmailShell(`
      <h2 style="margin-bottom: 8px;">Welcome back!</h2>
      <p>Hello ${escapeHtml(greeting)},</p>
      <p>Your ISMACONNECT account, listings, and storefronts are active and visible to other users again.</p>
      <p>If you did not make this change, please contact us right away at admin@ismaconnect.ca.</p>
    `),
    text: `Welcome back!

Hello ${greeting},

Your ISMACONNECT account, listings, and storefronts are active and visible to other users again.

If you did not make this change, please contact us right away at admin@ismaconnect.ca.`
  });
}

export async function sendAccountDeletedEmail(args: { to: string; recipientName?: string | null }) {
  const greeting = args.recipientName?.trim() || "there";
  const subject = "Your ISMACONNECT account has been deleted";

  await sendAccountStatusEmail({
    to: args.to,
    subject,
    html: wrapEmailShell(`
      <h2 style="margin-bottom: 8px;">Your account has been deleted</h2>
      <p>Hello ${escapeHtml(greeting)},</p>
      <p>
        Your ISMACONNECT profile, listings, and storefronts have been removed, and you can no longer sign in
        to this account. Some records, such as payment history and conversations with other users, are
        retained where we have a legal or fraud-prevention reason to keep them.
      </p>
      <p>If you did not make this change, please contact us right away at admin@ismaconnect.ca.</p>
    `),
    text: `Your account has been deleted

Hello ${greeting},

Your ISMACONNECT profile, listings, and storefronts have been removed, and you can no longer sign in to this
account. Some records, such as payment history and conversations with other users, are retained where we have
a legal or fraud-prevention reason to keep them.

If you did not make this change, please contact us right away at admin@ismaconnect.ca.`
  });
}

export async function sendAccountSuspendedEmail(args: {
  to: string;
  recipientName?: string | null;
  reason?: string | null;
}) {
  const greeting = args.recipientName?.trim() || "there";
  const subject = "Your ISMACONNECT account has been suspended";
  const reasonLine = args.reason?.trim() ? `Reason: ${args.reason.trim()}` : "";

  await sendAccountStatusEmail({
    to: args.to,
    subject,
    html: wrapEmailShell(`
      <h2 style="margin-bottom: 8px;">Your account has been suspended</h2>
      <p>Hello ${escapeHtml(greeting)},</p>
      <p>
        An ISMACONNECT admin has suspended your account. You cannot sign in, and your listings and storefronts
        are hidden from other users, until an admin restores access.
      </p>
      ${reasonLine ? `<p>${escapeHtml(reasonLine)}</p>` : ""}
      <p>If you believe this is a mistake, please contact us at admin@ismaconnect.ca.</p>
    `),
    text: `Your account has been suspended

Hello ${greeting},

An ISMACONNECT admin has suspended your account. You cannot sign in, and your listings and storefronts are
hidden from other users, until an admin restores access.
${reasonLine ? `\n${reasonLine}\n` : ""}
If you believe this is a mistake, please contact us at admin@ismaconnect.ca.`
  });
}

export async function sendAccountRestoredEmail(args: { to: string; recipientName?: string | null }) {
  const greeting = args.recipientName?.trim() || "there";
  const subject = "Your ISMACONNECT account access has been restored";

  await sendAccountStatusEmail({
    to: args.to,
    subject,
    html: wrapEmailShell(`
      <h2 style="margin-bottom: 8px;">Your account access has been restored</h2>
      <p>Hello ${escapeHtml(greeting)},</p>
      <p>An ISMACONNECT admin has restored your account. You can sign in again, and your listings and storefronts are visible to other users again.</p>
      <p>If you did not expect this, please contact us at admin@ismaconnect.ca.</p>
    `),
    text: `Your account access has been restored

Hello ${greeting},

An ISMACONNECT admin has restored your account. You can sign in again, and your listings and storefronts are
visible to other users again.

If you did not expect this, please contact us at admin@ismaconnect.ca.`
  });
}

export async function sendNewAccountAdminEmail(args: { email: string; fullName?: string | null }) {
  const { resendApiKey, emailFrom } = getEmailEnv();
  const resend = new Resend(resendApiKey);

  const name = args.fullName?.trim() || "(no name given)";
  const subject = `New ISMACONNECT account: ${args.email}`;

  const { error } = await resend.emails.send({
    from: emailFrom,
    to: [SITE_SUPPORT_EMAIL],
    subject,
    html: wrapEmailShell(`
      <h2 style="margin-bottom: 8px;">New account created</h2>
      <p><strong>Name:</strong> ${escapeHtml(name)}</p>
      <p><strong>Email:</strong> ${escapeHtml(args.email)}</p>
    `),
    text: `New account created\n\nName: ${name}\nEmail: ${args.email}`
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function sendStorefrontClaimAdminEmail(args: {
  businessName: string;
  claimantName?: string | null;
  claimantEmail: string;
  message?: string | null;
}) {
  const { resendApiKey, emailFrom } = getEmailEnv();
  const resend = new Resend(resendApiKey);

  const claimantName = args.claimantName?.trim() || "(no name given)";
  const subject = `New business claim: ${args.businessName}`;

  const { error } = await resend.emails.send({
    from: emailFrom,
    to: [SITE_SUPPORT_EMAIL],
    subject,
    html: wrapEmailShell(`
      <h2 style="margin-bottom: 8px;">New business claim request</h2>
      <p><strong>Business:</strong> ${escapeHtml(args.businessName)}</p>
      <p><strong>Claimant:</strong> ${escapeHtml(claimantName)}</p>
      <p><strong>Email:</strong> ${escapeHtml(args.claimantEmail)}</p>
      ${args.message?.trim() ? `<p><strong>Message:</strong> ${escapeHtml(args.message.trim())}</p>` : ""}
      <p>Review it in the admin claims queue.</p>
    `),
    text: `New business claim request

Business: ${args.businessName}
Claimant: ${claimantName}
Email: ${args.claimantEmail}
${args.message?.trim() ? `Message: ${args.message.trim()}\n` : ""}
Review it in the admin claims queue.`
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function sendStorefrontClaimApprovedEmail(args: {
  to: string;
  recipientName?: string | null;
  businessName: string;
}) {
  const greeting = args.recipientName?.trim() || "there";
  const subject = `Your claim on ${args.businessName} was approved`;

  await sendAccountStatusEmail({
    to: args.to,
    subject,
    html: wrapEmailShell(`
      <h2 style="margin-bottom: 8px;">You now own ${escapeHtml(args.businessName)} on ISMACONNECT</h2>
      <p>Hello ${escapeHtml(greeting)},</p>
      <p>
        An ISMACONNECT admin approved your claim on <strong>${escapeHtml(args.businessName)}</strong>.
        You can now manage its info, reply to messages, and post listings under it from your dashboard.
      </p>
      <p>If you did not request this, please contact us right away at admin@ismaconnect.ca.</p>
    `),
    text: `You now own ${args.businessName} on ISMACONNECT

Hello ${greeting},

An ISMACONNECT admin approved your claim on ${args.businessName}. You can now manage its info, reply to
messages, and post listings under it from your dashboard.

If you did not request this, please contact us right away at admin@ismaconnect.ca.`
  });
}

export async function sendStorefrontClaimRejectedEmail(args: {
  to: string;
  recipientName?: string | null;
  businessName: string;
  reason?: string | null;
}) {
  const greeting = args.recipientName?.trim() || "there";
  const subject = `Your claim on ${args.businessName} was not approved`;
  const reasonLine = args.reason?.trim() ? `Reason: ${args.reason.trim()}` : "";

  await sendAccountStatusEmail({
    to: args.to,
    subject,
    html: wrapEmailShell(`
      <h2 style="margin-bottom: 8px;">Your business claim was not approved</h2>
      <p>Hello ${escapeHtml(greeting)},</p>
      <p>
        An ISMACONNECT admin was not able to approve your claim on <strong>${escapeHtml(args.businessName)}</strong>.
      </p>
      ${reasonLine ? `<p>${escapeHtml(reasonLine)}</p>` : ""}
      <p>If you believe this is a mistake, please contact us at admin@ismaconnect.ca.</p>
    `),
    text: `Your business claim was not approved

Hello ${greeting},

An ISMACONNECT admin was not able to approve your claim on ${args.businessName}.
${reasonLine ? `\n${reasonLine}\n` : ""}
If you believe this is a mistake, please contact us at admin@ismaconnect.ca.`
  });
}
