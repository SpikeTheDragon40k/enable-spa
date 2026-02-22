import { HttpsError } from "firebase-functions/v2/https";
import { getApp } from "firebase-admin/app";

export async function verifyRecaptcha(
  token: string,
  expectedAction: string,
  siteKey: string,
  apiKey: string
) {
  console.log("Verifying reCAPTCHA token for action:", expectedAction, apiKey);

  const projectID = getApp().options.projectId;
  if (!projectID) {
    throw new Error("Project ID is required");
  }

  const url = `https://recaptchaenterprise.googleapis.com/v1/projects/${projectID}/assessments?key=${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      event: {
        token,
        siteKey,
      },
    }),
  });

  if (!response.ok) {
    throw new HttpsError("internal", "Errore chiamata reCAPTCHA REST API");
  }

  const result = await response.json();

  // Verifica che il token sia valido
  if (!result.tokenProperties?.valid) {
    console.log(
      `The CreateAssessment call failed because the token was: ${result.tokenProperties?.invalidReason}`
    );
    throw new HttpsError("permission-denied", "Invalid reCAPTCHA token");
  }

  // Controlla se è stata eseguita l'azione prevista
  if (result.tokenProperties?.action !== expectedAction) {
    console.log(
      "The action attribute in your reCAPTCHA tag does not match the action you are expecting to score"
    );
    throw new HttpsError("permission-denied", "Action mismatch");
  }

  // Ottieni il punteggio di rischio e i motivi
  const score = result.riskAnalysis?.score ?? 0;
  const reasons = result.riskAnalysis?.reasons ?? [];

  console.log(`The reCAPTCHA score is: ${score}`);
  reasons.forEach((reason: string) => {
    console.log(reason);
  });

  return {
    score,
    reasons,
  };
}