/**
 * Apps Script for Google Form → Socios Backoffice webhook.
 * Paste into the Form (or linked Spreadsheet) Apps Script editor.
 *
 * Docs: docs/GOOGLE_FORM.md
 */

const WEBHOOK_URL = "https://YOUR_NGROK_HOST/api/webhooks/google-form";
const WEBHOOK_SECRET = "local-google-form-webhook-secret";

/**
 * @param {GoogleAppsScript.Events.FormsOnFormSubmit} e
 */
function onFormSubmit(e) {
  const responses = e.response.getItemResponses();
  const byTitle = {};

  for (let i = 0; i < responses.length; i++) {
    const item = responses[i];
    byTitle[normalizeTitle(item.getItem().getTitle())] = String(item.getResponse()).trim();
  }

  const email =
    byTitle[normalizeTitle("Email")] ||
    (e.response.getRespondentEmail && e.response.getRespondentEmail()) ||
    "";

  const payload = {
    email: email,
    firstName: byTitle[normalizeTitle("NOMBRE")] || "",
    lastName: byTitle[normalizeTitle("APELLIDO")] || "",
    dni: String(byTitle[normalizeTitle("DNI")] || "").replace(/\D/g, ""),
    birthDate:
      byTitle[normalizeTitle("FECHA DE NACIMIENTO")] ||
      byTitle[normalizeTitle("FECHA NACIMIENTO")] ||
      "",
    phone: byTitle[normalizeTitle("NUMERO DE TELEFONO")] || "",
  };

  if (
    !payload.email ||
    !payload.firstName ||
    !payload.lastName ||
    !payload.dni ||
    !payload.birthDate ||
    !payload.phone
  ) {
    throw new Error("Missing required form fields: " + JSON.stringify(payload));
  }

  const response = UrlFetchApp.fetch(WEBHOOK_URL, {
    method: "post",
    contentType: "application/json",
    headers: {
      "X-Webhook-Secret": WEBHOOK_SECRET,
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  });

  const code = response.getResponseCode();
  if (code < 200 || code >= 300) {
    throw new Error("Webhook failed (" + code + "): " + response.getContentText());
  }
}

/**
 * @param {string} title
 * @return {string}
 */
function normalizeTitle(title) {
  return String(title || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}
