import { getDemoAdminHint, isDemoMode } from "@/lib/demo-mode";

/** Banner solo para entorno showcase (`NEXT_PUBLIC_DEMO_MODE=true`). */
export function DemoBanner() {
  if (!isDemoMode()) {
    return null;
  }

  const admin = getDemoAdminHint();
  const accountsHint = admin ? `${admin.email} · ${admin.password}` : null;

  return (
    <div
      role="status"
      className="demo-banner"
      style={{
        borderBottom: "1px solid color-mix(in srgb, #b45309 25%, transparent)",
        background: "color-mix(in srgb, #fef3c7 90%, transparent)",
        padding: "0.5rem 1rem",
        textAlign: "center",
        fontSize: "0.875rem",
        color: "#78350f",
      }}
    >
      <p style={{ margin: 0, fontWeight: 600 }}>Modo demo · datos ficticios (portfolio)</p>
      {accountsHint ? (
        <p style={{ margin: "0.15rem 0 0", fontSize: "0.75rem", opacity: 0.9 }}>{accountsHint}</p>
      ) : null}
    </div>
  );
}
