export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const preferredRegion = "auto";

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
  try {
    const { SignJWT } = await import("jose");
    const { prisma } = await import("@/lib/prisma");
    const { randomUUID } = await import("crypto");

    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");

    if (!code) {
      return NextResponse.json({ error: "No code provided" }, { status: 400 });
    }

    //  environment variables
    const clientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;
    const secret = process.env.JWT_SECRET;

    if (!clientId || !clientSecret || !secret) {
      console.error(" Missing required environment variables");
      return NextResponse.json(
        { error: "Server misconfigured" },
        { status: 500 }
      );
    }

    const JWT_SECRET = new TextEncoder().encode(secret);

    const tokenRes = await fetch(
      "https://github.com/login/oauth/access_token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          code,
        }),
      }
    );

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      console.error("GitHub token exchange failed:", tokenData);
      return NextResponse.json(
        { error: "GitHub authentication failed" },
        { status: 401 }
      );
    }

    const [userRes, emailRes] = await Promise.all([
      fetch("https://api.github.com/user", {
        headers: { Authorization: `Bearer ${accessToken}` },
      }),
      fetch("https://api.github.com/user/emails", {
        headers: { Authorization: `Bearer ${accessToken}` },
      }),
    ]);

    const ghUser = await userRes.json();
    const emails = await emailRes.json();
    const primaryEmail =
      emails.find((e: any) => e.primary && e.verified)?.email || ghUser.email;

    if (!primaryEmail) {
      return NextResponse.json(
        { error: "Could not retrieve user email" },
        { status: 400 }
      );
    }

    const user = await prisma.user.upsert({
      where: { email: primaryEmail },
      update: {
        name: ghUser.name ?? ghUser.login,
        imgUrl: ghUser.avatar_url,
        isVerified: true,
      },
      create: {
        email: primaryEmail,
        name: ghUser.name ?? ghUser.login,
        imgUrl: ghUser.avatar_url,
        isVerified: true,
      },
    });

    // Create session JWT
    const jti = randomUUID();
    const sessionToken = await new SignJWT({ sub: user.id, jti })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(JWT_SECRET);

    // Manage sessions (1 active user)
    const sessions = await prisma.session.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "asc" },
    });

    if (sessions.length >= 1) {
      await prisma.session.delete({ where: { id: sessions[0].id } });
    }

    await prisma.session.create({
      data: {
        jti,
        userId: user.id,
        deviceId: randomUUID(),
        token: sessionToken,
        userAgent: req.headers.get("user-agent") ?? "unknown",
        ipAddress:
          req.headers.get("x-forwarded-for") ??
          req.headers.get("remote-addr") ??
          "unknown",
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    // Set cookie
    const cookieStore: any = cookies();
    cookieStore.set("drifnet_session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return NextResponse.redirect(new URL("/", req.url));
  } catch (err: any) {
    console.error("GitHub OAuth error:", err);
    return NextResponse.json(
      { error: "Internal Server Error", details: err.message },
      { status: 500 }
    );
  }
}
