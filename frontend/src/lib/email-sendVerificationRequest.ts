"use server";
import { EmailConfig } from "next-auth/providers/email";
import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY || "");

// identifier: string
//   url: string
//   expires: Date
//   provider: EmailConfig
//   token: string
//   theme: Theme

const sendVerificationRequest = async ({
  identifier: email,
  url,
  provider,
}: {
  identifier: string;
  url: string;
  provider: EmailConfig;
}) => {
  try {
    const msg = {
      to: email,
      from: provider.from,
      subject: "Your Magic Link",
      html: `
                    <h1>Your Magic Link</h1>
                    <p>Click the link below to sign in to your account:</p>
                    <a href="${url}">Sign In</a>
                    <br />
                    <p>If you did not request this email, you can safely ignore it.</p>
                  `,
    };

    await sgMail.send(msg);

    console.log("Magic link email sent successfully with SendGrid.");
  } catch (error) {
    console.error("SendGrid email error:", error);
  }
};

export default sendVerificationRequest;
