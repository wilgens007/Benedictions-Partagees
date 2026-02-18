import { Request, Response, NextFunction } from "express";
import { db } from "./db";
import { adminSessions } from "@shared/schema";
import { eq, gt } from "drizzle-orm";
import { randomUUID } from "crypto";

function getAdminEmails(): string[] {
  const raw = process.env.ADMIN_EMAILS || "";
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string): boolean {
  const allowed = getAdminEmails();
  return allowed.includes(email.trim().toLowerCase());
}

export async function createAdminSession(email: string): Promise<string> {
  const token = randomUUID();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await db.insert(adminSessions).values({ email, token, expiresAt });
  return token;
}

export async function validateAdminToken(token: string): Promise<string | null> {
  const rows = await db
    .select()
    .from(adminSessions)
    .where(eq(adminSessions.token, token));
  if (rows.length === 0) return null;
  const session = rows[0];
  if (new Date(session.expiresAt) < new Date()) {
    await db.delete(adminSessions).where(eq(adminSessions.id, session.id));
    return null;
  }
  return session.email;
}

export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const token =
    req.headers["x-admin-token"] as string ||
    req.cookies?.admin_token ||
    null;

  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const email = await validateAdminToken(token);
  if (!email) {
    return res.status(401).json({ error: "Invalid or expired session" });
  }

  (req as any).adminEmail = email;
  next();
}
