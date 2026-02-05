import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { generateToken } from "@/lib/auth/jwt";

const TEST_EMAIL = "tester@google.com";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, code } = body;

    if (!email || !code) {
      return NextResponse.json(
        { error: "Email and code are required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase();

    // Check if test account - bypass OTP verification
    const isTestAccount = normalizedEmail === TEST_EMAIL;

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

    const db = await getDb();

    // Skip OTP verification for test account
    if (!isTestAccount) {
      // Verify code
      const otpRecord = await db("otp_codes")
        .where({
          email: normalizedEmail,
          code,
          used: false,
        })
        .where("expires_at", ">", new Date())
        .orderBy("created_at", "desc")
        .first();

      if (!otpRecord) {
        return NextResponse.json(
          { error: "Invalid or expired code" },
          { status: 400 }
        );
      }

      // Mark code as used
      await db("otp_codes")
        .where({ id: otpRecord.id })
        .update({ used: true, updated_at: new Date() });
    } else {
      console.log("[AUTH] Test account - bypassing OTP verification");
    }

    // Generate JWT (using a fake user ID for admin - in a real app you'd have an admin users table)
    const token = generateToken({
      userId: 1, // Admin user ID
      email: normalizedEmail,
    });

    // Create response with token
    const response = NextResponse.json({
      success: true,
      token,
      user: {
        email: normalizedEmail,
        role: "admin",
      },
    });

    // Set cookie server-side to ensure it's available for middleware on redirect
    // Use shared domain in production for cross-app auth sync
    response.cookies.set("auth_token", token, {
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      httpOnly: false, // Allow client-side access for cross-tab sync
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      domain: process.env.NODE_ENV === "production" ? ".getalloro.com" : undefined,
    });

    return response;
  } catch (error) {
    console.error("OTP Verify Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
