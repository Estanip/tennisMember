import type { Member } from "@socios/shared";
import { MEMBER_CONDITION_LABELS, MEMBER_STATUS_LABELS } from "@socios/shared";
import { getLogger } from "../lib/logger.js";
import { getEmailProvider } from "./email/factory.js";

export type MemberCreatedSource = "APP" | "GOOGLE_FORM" | "IMPORT";

const log = getLogger("email");

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function buildNewMemberAlertContent(
  member: Member,
  source: MemberCreatedSource,
): { subject: string; text: string; html: string } {
  const statusLabel = MEMBER_STATUS_LABELS[member.status] ?? String(member.status);
  const conditionLabel = MEMBER_CONDITION_LABELS[member.condition] ?? member.condition;
  const sourceLabel =
    source === "GOOGLE_FORM"
      ? "Google Form"
      : source === "IMPORT"
        ? "Importación Excel"
        : "Backoffice";

  const subject = `[Socios] Nuevo socio: ${member.fullName}`;
  const text = [
    "Se registró un nuevo socio en el padrón.",
    "",
    `Origen: ${sourceLabel}`,
    `Nombre: ${member.firstName}`,
    `Apellido: ${member.lastName}`,
    `Email: ${member.email ?? "—"}`,
    `DNI: ${member.dni}`,
    `Fecha de nacimiento: ${member.birthDate}`,
    `Edad: ${member.age}`,
    `Categoría: ${member.ageCategory === "MENOR" ? "Menor" : "Adulto"}`,
    `Teléfono: ${member.phone ?? "—"}`,
    `Condición: ${conditionLabel}`,
    `Estado: ${statusLabel}`,
    `Id: ${member.id}`,
  ].join("\n");

  const html = `
    <div style="font-family:system-ui,sans-serif;line-height:1.5">
      <p>Se registró un nuevo socio en el padrón.</p>
      <ul>
        <li><strong>Origen:</strong> ${escapeHtml(sourceLabel)}</li>
        <li><strong>Nombre:</strong> ${escapeHtml(member.firstName)}</li>
        <li><strong>Apellido:</strong> ${escapeHtml(member.lastName)}</li>
        <li><strong>Email:</strong> ${escapeHtml(member.email ?? "—")}</li>
        <li><strong>DNI:</strong> ${escapeHtml(member.dni)}</li>
        <li><strong>Fecha de nacimiento:</strong> ${escapeHtml(member.birthDate)}</li>
        <li><strong>Edad:</strong> ${member.age}</li>
        <li><strong>Categoría:</strong> ${member.ageCategory === "MENOR" ? "Menor" : "Adulto"}</li>
        <li><strong>Teléfono:</strong> ${escapeHtml(member.phone ?? "—")}</li>
        <li><strong>Condición:</strong> ${escapeHtml(conditionLabel)}</li>
        <li><strong>Estado:</strong> ${escapeHtml(statusLabel)}</li>
        <li><strong>Id:</strong> ${escapeHtml(member.id)}</li>
      </ul>
    </div>
  `.trim();

  return { subject, text, html };
}

/**
 * Notifies ADMIN_ALERT_EMAIL after member create.
 * Failures are logged and do not throw — callers should not await if they want zero latency coupling.
 */
export async function notifyAdminNewMember(
  member: Member,
  source: MemberCreatedSource,
): Promise<void> {
  const to = process.env.ADMIN_ALERT_EMAIL?.trim();
  if (!to) {
    log.warn("ADMIN_ALERT_EMAIL is not set; skipping new-member alert");
    return;
  }

  const content = buildNewMemberAlertContent(member, source);

  try {
    await getEmailProvider().send({ to, ...content });
    log.info({ to, source, memberId: member.id }, "New-member alert sent");
  } catch (error) {
    log.error({ err: error, to, source, memberId: member.id }, "Failed to send new-member alert");
  }
}
