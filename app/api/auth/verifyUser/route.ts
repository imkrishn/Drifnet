export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { jwtVerify } from "jose";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    //  Get token from cookie
    const token = req.cookies.get("drifnet_session")?.value;
    if (!token) return NextResponse.json({ valid: false });

    // Access env variable safely at runtime
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error("Missing JWT_SECRET environment variable");
      return NextResponse.json(
        { valid: false, error: "Server misconfiguration" },
        { status: 500 }
      );
    }

    const JWT_SECRET = new TextEncoder().encode(secret);

    // Verify token
    let payload;
    try {
      ({ payload } = await jwtVerify(token, JWT_SECRET, {
        algorithms: ["HS256"],
      }));
    } catch (err) {
      console.error("Invalid JWT:", err);
      return NextResponse.json({ valid: false, error: "Invalid token" });
    }

    if (!payload.sub) return NextResponse.json({ valid: false });

    // Validate session
    const session = await prisma.session.findUnique({
      where: { jti: payload.jti as string },
    });
    if (!session) return NextResponse.json({ valid: false });

    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: payload.sub as string },
      select: {
        id: true,
        name: true,
        email: true,
        imgUrl: true,
        _count: {
          select: {
            follower: true,
            following: true,
          },
        },
        communityMemberships: {
          select: {
            community: {
              select: {
                id: true,
                name: true,
                ownerId: true,
              },
            },
          },
        },
      },
    });

    if (!user) return NextResponse.json({ valid: false });

    return NextResponse.json({ valid: true, user });
  } catch (error) {
    console.error("Error validating session:", error);
    return NextResponse.json({ valid: false });
  }
}
