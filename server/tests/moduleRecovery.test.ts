import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isModuleLoadError, recoverModuleLoad } from "../../client/src/lib/moduleRecovery";

const reload = vi.fn();
let values: Map<string, string>;

beforeEach(() => {
  values = new Map();
  reload.mockReset();
  vi.stubGlobal("window", {
    sessionStorage: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    },
    location: { reload },
  });
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("failed page module recovery", () => {
  it.each([
    "Failed to fetch dynamically imported module: /src/pages/Music.tsx",
    "Importing a module script failed.",
    "error loading dynamically imported module",
    "Loading chunk 12 failed.",
  ])("recognizes a module load failure: %s", message => {
    expect(isModuleLoadError(new TypeError(message))).toBe(true);
  });

  it("reloads once but prevents repeated failures from causing a reload loop", () => {
    vi.spyOn(Date, "now").mockReturnValue(100_000);
    const error = new TypeError("Failed to fetch dynamically imported module");
    expect(recoverModuleLoad(error)).toBe(true);
    expect(recoverModuleLoad(error)).toBe(false);
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("allows a later recovery after the cooldown", () => {
    const now = vi.spyOn(Date, "now").mockReturnValue(100_000);
    const error = new TypeError("Failed to fetch dynamically imported module");
    recoverModuleLoad(error);
    now.mockReturnValue(160_001);
    expect(recoverModuleLoad(error)).toBe(true);
    expect(reload).toHaveBeenCalledTimes(2);
  });

  it("does not hide unrelated application errors", () => {
    expect(recoverModuleLoad(new Error("Invalid hook call"))).toBe(false);
    expect(recoverModuleLoad(new Error("Permission denied"))).toBe(false);
    expect(recoverModuleLoad(null)).toBe(false);
    expect(reload).not.toHaveBeenCalled();
  });

  it("does not reload when storage is unavailable and a loop cannot be guarded", () => {
    vi.stubGlobal("window", {
      get sessionStorage() { throw new Error("Storage blocked"); },
      location: { reload },
    });
    expect(recoverModuleLoad(new Error("Failed to fetch dynamically imported module"))).toBe(false);
    expect(reload).not.toHaveBeenCalled();
  });
});
