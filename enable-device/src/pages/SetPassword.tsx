import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth, updatePassword, type User } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { functions } from "../firebase";
import { Password } from "primereact/password";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";

export default function SetPassword() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [userDocChecked, setUserDocChecked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const [toastRef] = useState<any>(() => ({ current: null }));

  useEffect(() => {
    const checkAuthAndUserDoc = async () => {
      const auth = getAuth();
      const db = getFirestore();
      const user = auth.currentUser;
      if (!user) {
        navigate("/login", { replace: true });
        return;
      }
      // Controlla mustSetPassword su Firestore
      const userRef = doc(db, "users", user.uid);
      const snap = await getDoc(userRef);
      if (!snap.exists()) {
        setError("Utente non trovato.");
        return;
      }
      const data = snap.data();
      if (!data.mustSetPassword) {
        navigate("/home", { replace: true });
        return;
      }
      setUserDocChecked(true);
    };
    checkAuthAndUserDoc();
  }, [navigate]);

  const showToast = (severity: string, summary: string, detail: string) => {
    toastRef.current?.show({ severity, summary, detail, life: 4000 });
  };

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validazione lato client
    if (password.length < 8) {
      setError("La password deve essere lunga almeno 8 caratteri.");
      return;
    }
    if (password !== confirm) {
      setError("Le password non coincidono.");
      return;
    }

    setLoading(true);
    try {
      const auth = getAuth();
      const user = auth.currentUser as User;
      if (!user || !user.email) {
        setError("Utente non autenticato.");
        navigate("/login", { replace: true });
        return;
      }

      // Aggiorna la password dell'utente
      await updatePassword(user, password);

      // Forza refresh del token
      await user.getIdToken(true);

      // Chiama la function setPassword (non invia la password)
      const setPasswordFn = httpsCallable(functions, "setPassword");
      await setPasswordFn();

      showToast("success", "Password impostata", "La password è stata impostata correttamente.");
      setTimeout(() => navigate("/home", { replace: true }), 1000);
    } catch (err: any) {
      // Gestione errori specifici
      if (err.code === "auth/provider-already-linked") {
        setError("Hai già impostato una password.");
        navigate("/home", { replace: true });
      } else if (err.code === "auth/weak-password") {
        setError("La password è troppo debole.");
      } else if (err.code === "auth/requires-recent-login") {
        setError("Per motivi di sicurezza, effettua nuovamente il login.");
        navigate("/login", { replace: true });
      } else {
        setError(err.message || "Errore durante l'impostazione della password.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!userDocChecked) {
    return <div>Caricamento...</div>;
  }

  return (
    <div style={{ maxWidth: 400, margin: "100px auto" }}>
      <Toast ref={toastRef} />
      <h2>Imposta una nuova password</h2>
      <form onSubmit={handleSetPassword}>
        <div className="p-fluid">
          <Password
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Nuova password"
            toggleMask
            feedback={false}
            className="mb-3"
            autoComplete="new-password"
          />
          <Password
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            placeholder="Conferma password"
            toggleMask
            feedback={false}
            className="mb-3"
            autoComplete="new-password"
          />
          {error && (
            <div style={{ color: "red", marginBottom: 12 }}>{error}</div>
          )}
          <Button
            label={loading ? "Impostazione in corso..." : "Imposta password"}
            type="submit"
            disabled={loading}
          />
        </div>
      </form>
    </div>
  );
}
