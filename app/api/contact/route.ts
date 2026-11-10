import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { z } from "zod";

import { env } from "@/env.mjs";
import { siteConfig } from "@/config/site";

const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Please provide a valid email address"),
  phone: z.string().max(25).optional().or(z.literal("")),
  subject: z.string().min(2, "Subject is required"),
  message: z.string().min(10, "Message must be at least 10 characters").max(3000),
  honeypot: z.string().max(0, "Bot detected").optional().or(z.literal("")),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = contactSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Validation failed",
          errors: parsed.error.flatten().fieldErrors,
        },
        { status: 422 },
      );
    }

    const { name, email, phone, subject, message } = parsed.data;

    const resendApiKey = process.env.RESEND_API_KEY;
    const recipientEmail = siteConfig.mailSupport || "info@fastlearnersapp.com";
    const senderEmail =
      process.env.EMAIL_FROM || "FastLearners Contact <support@fastlearnersapp.com>";

    if (!resendApiKey || resendApiKey === "your_resend_api_key") {
      // In development or if key not configured, log contact message safely and return success
      console.log("[CONTACT_FORM_SUBMISSION]", {
        name,
        email,
        phone,
        subject,
        messagePreview: message.substring(0, 80),
        timestamp: new Date().toISOString(),
      });

      return NextResponse.json(
        {
          success: true,
          message: "Your message has been sent successfully. We will be in touch soon!",
        },
        { status: 200 },
      );
    }

    const resend = new Resend(resendApiKey);

    await resend.emails.send({
      from: senderEmail,
      to: recipientEmail,
      reply_to: email,
      subject: `[Contact Form] ${subject} - ${name}`,
      text: `Name: ${name}\nEmail: ${email}\nPhone: ${phone || "Not provided"}\nSubject: ${subject}\n\nMessage:\n${message}`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 8px; padding: 24px;">
          <h2 style="color: #4F46E5; margin-top: 0;">New Contact Form Submission</h2>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 16px 0;" />
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
          <p><strong>Phone:</strong> ${phone || "Not provided"}</p>
          <p><strong>Subject:</strong> ${subject}</p>
          <div style="margin-top: 20px; background-color: #f9f9f9; padding: 16px; border-radius: 6px;">
            <p style="margin-top: 0; font-weight: bold;">Message:</p>
            <p style="white-space: pre-wrap; margin-bottom: 0;">${message}</p>
          </div>
        </div>
      `,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Your message has been sent successfully. We will be in touch soon!",
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("[CONTACT_FORM_ERROR]", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to submit message. Please try again later.",
      },
      { status: 500 },
    );
  }
}

