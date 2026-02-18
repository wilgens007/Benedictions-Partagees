import { Router } from "express";
import { registerUserSchema, loginUserSchema } from "@shared/schema";
import {
  registerUser,
  loginUser,
  createUserSession,
  requireUser,
  deleteUserSession,
} from "./userAuth";

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
    stripeCustomerId: user.stripeCustomerId,
  });
});

export default router;
