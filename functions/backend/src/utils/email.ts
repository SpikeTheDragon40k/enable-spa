import {getFirestore} from "firebase-admin/firestore";

export async function sendRegistrationEmail(
  to: string,
  link: string
) {
  const db = getFirestore();
  try {
    await db.collection('mail').add({
      to: [to],
      message: {
        subject: 'Completa la registrazione come volontario - e-Nable Italia',
        html: `
          <div style="font-family: Arial, sans-serif; max-width:600px; margin:auto;">
            <h2 style="color:#2c7be5;">Benvenuto in e-Nable Italia</h2>
            <p>Clicca il pulsante qui sotto per completare la registrazione:</p>
            <div style="margin: 24px 0;">
              <a href="${link}"
                 style="background:#2c7be5;
                        color:white;
                        padding:12px 24px;
                        text-decoration:none;
                        border-radius:6px;
                        display:inline-block;">
                Completa registrazione
              </a>
            </div>
            <p style="font-size:14px;color:#555;">
              Se non hai richiesto questa email puoi ignorarla.
            </p>
          </div>
        `,
      },
    });
    console.log(`Registration email sent to ${to}`);
    return true;
  } catch (error) {
    console.error("Error sending registration email:", error);
    return false;
  }
}
