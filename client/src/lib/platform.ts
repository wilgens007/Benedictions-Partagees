export function isCapacitor(): boolean {
  return !!(window as any).Capacitor;
}

export function isAndroid(): boolean {
  if (isCapacitor()) {
    const cap = (window as any).Capacitor;
    return cap.getPlatform?.() === "android" || cap.platform === "android";
  }
  return /Android/i.test(navigator.userAgent);
}

export function isAndroidApp(): boolean {
  return isCapacitor() && isAndroid();
}
