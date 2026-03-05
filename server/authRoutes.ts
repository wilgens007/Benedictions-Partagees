import { Router } from "express";
import { registerUserSchema, loginUserSchema, users, passwordResetTokens } from "@shared/schema";
import {
  registerUser,
  loginUser,
  createUserSession,
  requireUser,
  deleteUserSession,
} from "./userAuth";
import { db } from "./db";
import { eq, and, gt } from "drizzle-orm";
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { sendPasswordResetEmail } from "./resend";

const router = Router();

router.post("/api/auth/register", async (req, res) => {
  try {
    const validation = registerUserSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: "Invalid input", details: validation.error.issues });
    }

    const { email, password, name } = validation.data;
    const user = await registerUser(email, password, name);
    const token = await createUserSession(user.id);

    res.cookie("user_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      id: user.id,
      email: user.email,
      username: user.username,
      isPremium: user.isPremium,
    });
  } catch (error: any) {
    if (error.message === "Email already registered") {
      return res.status(409).json({ error: error.message });
    }
    console.error("Registration error:", error.message);
    res.status(500).json({ error: "Registration failed" });
  }
});

router.post("/api/auth/login", async (req, res) => {
  try {
    const validation = loginUserSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: "Invalid input", details: validation.error.issues });
    }

    const { email, password } = validation.data;
    const user = await loginUser(email, password);
    const token = await createUserSession(user.id);

    res.cookie("user_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.json({
      id: user.id,
      email: user.email,
      username: user.username,
      isPremium: user.isPremium,
    });
  } catch (error: any) {
    if (error.message === "Invalid email or password") {
      return res.status(401).json({ error: error.message });
    }
    console.error("Login error:", error.message);
    res.status(500).json({ error: "Login failed" });
  }
});

router.post("/api/auth/logout", async (req, res) => {
  const token = req.cookies?.user_token;
  if (token) {
    await deleteUserSession(token);
  }
  res.clearCookie("user_token");
  res.json({ success: true });
});

router.get("/api/auth/me", requireUser, async (req: any, res) => {
  const user = req.user;
  res.json({
    id: user.id,
    email: user.email,
    username: user.username,
    isPremium: user.isPremium,
    premiumSince: user.premiumSince,
    premiumSource: user.premiumSource,
    premiumExpiresAt: user.premiumExpiresAt,
  });
});

router.get("/api/me", requireUser, async (req: any, res) => {
  const user = req.user;
  res.json({
    id: user.id,
    username: user.username,
    email: user.email,
    isPremium: user.isPremium,
    premiumSource: user.premiumSource,
    premiumExpiresAt: user.premiumExpiresAt,
    premiumSince: user.premiumSince,
  });
});

router.post("/api/auth/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const [user] = await db.select().from(users).where(eq(users.email, normalizedEmail));

    if (user) {
      const token = randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

      await db.insert(passwordResetTokens).values({
        userId: user.id,
        token,
        expiresAt,
      });

      const baseUrl = `${req.protocol}://${req.get("host")}`;
      const resetUrl = `${baseUrl}/reset-password?token=${token}`;

      try {
        await sendPasswordResetEmail(normalizedEmail, resetUrl);
        console.log(`[AUTH] Password reset email sent to ${normalizedEmail}`);
      } catch (emailErr: any) {
        console.error(`[AUTH] Failed to send reset email:`, emailErr.message);
      }
    }

    res.json({ message: "If that email exists, a reset link has been sent." });
  } catch (error: any) {
    console.error("Forgot password error:", error.message);
    res.status(500).json({ error: "Failed to process request" });
  }
});

router.post("/api/auth/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ error: "Token and new password are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    const [resetToken] = await db
      .select()
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.token, token),
          eq(passwordResetTokens.used, false),
          gt(passwordResetTokens.expiresAt, new Date())
        )
      );

    if (!resetToken) {
      return res.status(400).json({ error: "Invalid or expired reset link" });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await db.update(users).set({ password: passwordHash }).where(eq(users.id, resetToken.userId));
    await db.update(passwordResetTokens).set({ used: true }).where(eq(passwordResetTokens.id, resetToken.id));

    console.log(`[AUTH] Password reset successful for user ${resetToken.userId}`);
    res.json({ message: "Password reset successful" });
  } catch (error: any) {
    console.error("Reset password error:", error.message);
    res.status(500).json({ error: "Failed to reset password" });
  }
});

export default router;
