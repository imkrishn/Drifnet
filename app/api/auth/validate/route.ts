export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const preferredRegion = "auto";

import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { jwtVerify } = await import("jose");
    const { prisma } = await import("@/lib/prisma");

    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { valid: false, message: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const { token } = body;
    if (!token) {
      return NextResponse.json(
        { valid: false, message: "Missing token" },
        { status: 400 }
      );
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error("❌ Missing JWT_SECRET environment variable");
      return NextResponse.json(
        { valid: false, message: "Server misconfigured" },
        { status: 500 }
      );
    }

    const JWT_SECRET = new TextEncoder().encode(secret);

    let payload;
    try {
      const verified = await jwtVerify(token, JWT_SECRET, {
        algorithms: ["HS256"],
      });
      payload = verified.payload;
    } catch (error) {
      console.warn("⚠️ Invalid token:", error);
      return NextResponse.json({ valid: false }, { status: 401 });
    }

    // Check if session still exists
    const session = await prisma.session.findUnique({
      where: { jti: payload.jti as string },
    });

    if (!session) {
      return NextResponse.json({ valid: false }, { status: 401 });
    }

    // Token is valid
    return NextResponse.json({
      valid: true,
      userId: payload.sub,
    });
  } catch (err) {
    console.error("🔥 Token validation error:", err);
    return NextResponse.json(
      { valid: false, message: "Server error" },
      { status: 500 }
    );
  }
}
