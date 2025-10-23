export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { token } = await req.json();
    if (!token) return NextResponse.json({ valid: false });

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error("Missing JWT_SECRET environment variable");
      return NextResponse.json({ valid: false });
    }

    const JWT_SECRET = new TextEncoder().encode(secret);

    const { payload } = await jwtVerify(token, JWT_SECRET, {
      algorithms: ["HS256"],
    });

    const session = await prisma.session.findUnique({
      where: { jti: payload.jti as string },
    });

    if (!session) {
      return NextResponse.json({ valid: false });
    }

    return NextResponse.json({ valid: true, userId: payload.sub });
  } catch (err) {
    console.error("Error validating token:", err);
    return NextResponse.json({ valid: false });
  }
}
