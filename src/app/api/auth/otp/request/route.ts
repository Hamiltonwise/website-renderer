import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { sendOTP } from "@/lib/auth/mail";

const TEST_EMAIL = "tester@google.com";

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase();

    // Check if test account - bypass OTP
    if (normalizedEmail === TEST_EMAIL) {
      console.log("[AUTH] Test account detected, skipping OTP email");
      return NextResponse.json({
        success: true,
        message: "Test account - no OTP required",
        isTestAccount: true,
      });
    }

    // Check if Super Admin
    const superAdminEmails = (process.env.SUPER_ADMIN_EMAILS || "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter((e) => e.length > 0);

    const isSuperAdmin = superAdminEmails.includes(normalizedEmail);

    if (!isSuperAdmin) {
      return NextResponse.json(
        {
          error: "Access denied. Your email is not authorized for Admin access.",
        },
        { status: 403 }
      );
    }

    const code = generateCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save code to database
    const db = await getDb();
    await db("otp_codes").insert({
      email: normalizedEmail,
      code,
      expires_at: expiresAt,
      created_at: new Date(),
      updated_at: new Date(),
    });

    // Send email
    const sent = await sendOTP(normalizedEmail, code);

    if (!sent) {
      return NextResponse.json(
        { error: "Failed to send email" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "OTP sent to email",
    });
  } catch (error) {
    console.error("OTP Request Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
