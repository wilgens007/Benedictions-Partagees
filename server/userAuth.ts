import { Request, Response, NextFunction } from "express";
import { db } from "./db";
import { users, userSessions } from "@shared/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";

export async function registerUser(email: string, password: string, name: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const existing = await db.select().from(users).where(eq(users.email, normalizedEmail));
  if (existing.length > 0) {
    throw new Error("Email already registered");
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const [user] = await db.insert(users).values({
    username: name,
    password: passwordHash,
    email: normalizedEmail,
    isPremium: false,
  }).returning();

  return user;
}

export async function loginUser(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const [user] = await db.select().from(users).where(eq(users.email, normalizedEmail));
  if (!user) {
    console.log(`[AUTH] No user found for email: ${normalizedEmail}`);
    throw new Error("Invalid email or password");
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    console.log(`[AUTH] Password mismatch for user: ${user.id}, email: ${normalizedEmail}`);
    throw new Error("Invalid email or password");
  }

  return user;
}

export async function createUserSession(userId: string): Promise<string> {
  const token = randomUUID();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await db.insert(userSessions).values({ userId, token, expiresAt });
  return token;
}

export async function validateUserToken(token: string): Promise<string | null> {
  const rows = await db.select().from(userSessions).where(eq(userSessions.token, token));
  if (rows.length === 0) return null;
  const session = rows[0];
  if (new Date(session.expiresAt) < new Date()) {
    await db.delete(userSessions).where(eq(userSessions.id, session.id));
    return null;
  }
  return session.userId;
}

export async function getUserById(userId: string) {
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  return user || null;
}

export async function requireUser(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.user_token || null;

  if (!token) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const userId = await validateUserToken(token);
  if (!userId) {
    return res.status(401).json({ error: "Invalid or expired session" });
  }

  const user = await getUserById(userId);
  if (!user) {
    return res.status(401).json({ error: "User not found" });
  }

  (req as any).user = user;
  next();
}

export async function optionalUser(req: Request, _res: Response, next: NextFunction) {
  const token = req.cookies?.user_token || null;

  if (token) {
    const userId = await validateUserToken(token);
    if (userId) {
      const user = await getUserById(userId);
      if (user) {
        (req as any).user = user;
      }
    }
  }

  next();
}

export function requirePremium(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user;
  if (!user) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  if (!user.isPremium) {
    return res.status(403).json({ error: "Premium subscription required" });
  }
  next();
}

export async function deleteUserSession(token: string) {
  await db.delete(userSessions).where(eq(userSessions.token, token));
}
