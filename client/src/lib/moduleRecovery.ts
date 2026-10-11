const RECOVERY_KEY = "bp:module-load-recovery";
const RECOVERY_WINDOW_MS = 60_000;

export function isModuleLoadError(error: unknown): boolean {
  const message = typeof error === "string" ? error
    : error && typeof error === "object" && "message" in error
      ? String(error.message) : "";
  return /failed to fetch dynamically imported module|importing a module script failed|error loading dynamically imported module|loading chunk .+ failed/i.test(message);
}

// Restarting the dev server or publishing can invalidate an already-open
// browser's module graph. Reload once, not indefinitely if offline or broken.
export function recoverModuleLoad(error: unknown): boolean {
  if (!isModuleLoadError(error) || typeof window === "undefined") return false;
  try {
    const previous = window.sessionStorage.getItem(RECOVERY_KEY);
    const now = Date.now();
    if (previous !== null && now - Number(previous) < RECOVERY_WINDOW_MS) return false;
    window.sessionStorage.setItem(RECOVERY_KEY, String(now));
  } catch {
    // Without persistent session storage we cannot safely guard a reload loop.
    return false;
  }
  window.location.reload();
  return true;
}
