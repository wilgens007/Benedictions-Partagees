import { Router } from "express";
import {
  registerUserSchema, loginUserSchema, users, passwordResetTokens,
  userSessions, savedVerses, prayerReactions, prayerComments,
  prayerReports, prayerRequests, playlists, playlistSongs, songPlays,
} from "@shared/schema";
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

router.delete("/api/auth/account", requireUser, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const userEmail = req.user.email;

    console.log(`[AUTH] Account deletion requested for user ${userId} (${userEmail})`);

    if (req.user.stripeSubscriptionId) {
      try {
        const { getUncachableStripeClient } = await import("./stripeClient");
        const stripe = getUncachableStripeClient();
        await stripe.subscriptions.cancel(req.user.stripeSubscriptionId);
        console.log(`[AUTH] Stripe subscription ${req.user.stripeSubscriptionId} cancelled for user ${userId}`);
      } catch (stripeErr: any) {
        console.error(`[AUTH] Failed to cancel Stripe subscription:`, stripeErr.message);
      }
    }

    await db.transaction(async (tx) => {
      const userPlaylists = await tx.select({ id: playlists.id }).from(playlists).where(eq(playlists.userId, userId));
      for (const pl of userPlaylists) {
        await tx.delete(playlistSongs).where(eq(playlistSongs.playlistId, pl.id));
      }

      await tx.delete(prayerReactions).where(eq(prayerReactions.userId, userId));
      await tx.delete(prayerComments).where(eq(prayerComments.userId, userId));
      await tx.delete(prayerReports).where(eq(prayerReports.reporterUserId, userId));
      await tx.update(prayerRequests).set({ userId: null }).where(eq(prayerRequests.userId, userId));
      await tx.delete(savedVerses).where(eq(savedVerses.userId, userId));
      await tx.delete(playlists).where(eq(playlists.userId, userId));
      await tx.update(songPlays).set({ userId: null }).where(eq(songPlays.userId, userId));
      await tx.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, userId));
      await tx.delete(userSessions).where(eq(userSessions.userId, userId));
      await tx.delete(users).where(eq(users.id, userId));
    });

    res.clearCookie("user_token");

    console.log(`[AUTH] Account deleted successfully for user ${userId} (${userEmail})`);
    res.json({ success: true, message: "Account and all associated data have been deleted." });
  } catch (error: any) {
    console.error("Account deletion error:", error.message);
    res.status(500).json({ error: "Failed to delete account" });
  }
});

export default router;
