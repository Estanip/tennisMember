/** Showcase / portfolio: solo con NEXT_PUBLIC_DEMO_MODE=true en Vercel demo. */

export function isDemoMode(): boolean {
  return process.env.NEXT_PUBLIC_DEMO_MODE?.trim().toLowerCase() === "true";
}

export function getDemoAdminHint(): { email: string; password: string } | null {
  if (!isDemoMode()) {
    return null;
  }
  return {
    email: process.env.NEXT_PUBLIC_DEMO_ADMIN_EMAIL?.trim() || "admin@socios.demo",
    password: process.env.NEXT_PUBLIC_DEMO_ADMIN_PASSWORD?.trim() || "DemoAdmin123!",
  };
}
