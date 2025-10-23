import { prisma } from "@/lib/prisma";
import { SignJWT } from "jose";
import { cookies } from "next/headers";
import crypto from "crypto";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

class Session {
  public static async handleSessions({
    userId,
    ip,
    userAgent,
  }: {
    userId: string;
    ip: string;
    userAgent: string;
  }) {
    try {
      const jti = crypto.randomUUID();
      const cookie = await cookies();

      const token = await new SignJWT({ sub: userId, jti })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("7d")
        .sign(JWT_SECRET);

      const existing = await prisma.session.findFirst({
        where: { userId, userAgent },
      });

      //if session exists then update session for same browser
      if (!jti) return;
      if (existing) {
        const updated = await prisma.session.update({
          where: { id: existing.id },
          data: {
            jti,
            token,
            ipAddress: ip,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            createdAt: new Date(),
          },
        });

        cookie.set("drifnet_session", token, {
          httpOnly: true,
          secure: true,
          sameSite: "lax",
          path: "/",
          maxAge: 60 * 60 * 24 * 7, // 7 days
        });

        return { success: true, token, session: updated };
      }

      //if no session the create new

      const sessions = await prisma.session.findMany({
        where: { userId },
        orderBy: { createdAt: "asc" },
      });

      if (sessions.length >= 1) {
        await prisma.session.delete({ where: { id: sessions[0].id } });
      }

      const newSession = await prisma.session.create({
        data: {
          jti,
          userId,
          ipAddress: ip,
          deviceId: crypto.randomUUID(),
          userAgent,
          token,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      cookie.set("drifnet_session", token, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });

      return { success: true, token, session: newSession };
    } catch (err) {
      console.error("Error in handling sessions:", err);
      return { success: false, message: "Failed to handle session" };
    }
  }
}

export default Session;
