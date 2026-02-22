import { useEffect, useState, useRef } from "react";
import { getAuth, signInWithEmailLink } from "firebase/auth";
import { httpsCallable } from "firebase/functions";
import { functions } from "../firebase";
import { useNavigate } from "react-router-dom";
import { Toast } from "primereact/toast";

export default function CompleteRegistration() {
  const [error, setError] = useState<string | null>(null);
  const toast = useRef<Toast>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const complete = async () => {
      try {
        const auth = getAuth();

        const params = new URLSearchParams(window.location.search);
        const oobCode = params.get("oobCode");

        if (!oobCode) {
          setError("Link non valido.");
          return;
        }

        // getting email from oobCode
        const checkRegistration = httpsCallable(functions, "checkRegistration");
        const result = await checkRegistration({ oobCode });
        const data = result.data as { success?: boolean, email?: string };
        const email = data.email;

        // Completelogin
        if (!email) {
          setError("Email non trovata nel link.");
          toast.current?.show({
            severity: "error",
            summary: "Errore",
            detail: "Email non trovata nel link.",
            life: 4000,
          });
          setTimeout(() => navigate("/login"), 4000);
          return;
        }

        await signInWithEmailLink(auth, email, window.location.href);

        // force refresh token
        await auth.currentUser?.getIdToken(true);

        // activate backend
        const completeRegistration = httpsCallable(functions, "completeRegistration");
        await completeRegistration();

        navigate("/home");
      } catch (err) {
        console.error(err);
        setError("Link scaduto o già utilizzato.");
        toast.current?.show({
          severity: "error",
          summary: "Errore",
          detail: "Link scaduto o già utilizzato.",
          life: 4000,
        });
        setTimeout(() => navigate("/login"), 4000);
      }
    };

    complete();
  }, [navigate]);

  // Mostra toast e messaggio errore
  return (
    <div>
      <Toast ref={toast} />
      {error ? <div>{error}</div> : <div>Completamento registrazione in corso...</div>}
    </div>
  );
}
