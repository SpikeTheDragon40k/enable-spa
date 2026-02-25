import { useRef, useState } from "react";
import logo from "../assets/logo.png";
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { auth, functions, googleProvider } from "../firebase";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { useNavigate } from "react-router-dom";
import { Toast } from "primereact/toast";
import { httpsCallable } from "firebase/functions";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const toast = useRef<Toast>(null);

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      const doLogin = httpsCallable(functions, "doLogin");
      await doLogin();
      navigate("/home");
    } catch (err) {
      // Usa un toast per il messaggio di errore
      // Assicurati di importare e configurare il Toast di PrimeReact
      // Aggiungi una ref per il toast
      toast.current?.show({
        severity: "error",
        summary: "Errore",
        detail: "Login error",
        life: 3000,
      });
      console.error(err);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);

      // user auto provisioning on backend
      const autoprovisioning = httpsCallable(functions, "registerWithIntegratedAuth");
      await autoprovisioning();

      navigate("/home");
    } catch (err) {
      toast.current?.show({
        severity: "error",
        summary: "Errore",
        detail: "Login error",
        life: 3000,
      });
      console.error(err);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: "100px auto" }}>
      <div style={{ maxWidth: 400, margin: "36px auto" }}>
        <Toast ref={toast} />
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, marginBottom: 16, justifyContent: "center" }}>
          <img src={logo} alt="Logo" style={{ width: 64, height: 64 }} />
          <h2>e-Nable Italia</h2>
          <h3 style={{ color: "#888", textAlign: "center" }}>Portale di Accesso volontari</h3>
        </div>
        <div className="p-fluid">
          <InputText
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mb-3"
          />
          <InputText
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mb-3"
          />
          <Button label="Login" onClick={handleLogin} />
          <div style={{ textAlign: "center", margin: "16px 0" }}>
            <span>Oppure accedi con il tuo account Google</span>
          </div>
          <Button
            label="Continua con Google"
            icon="pi pi-google"
            onClick={handleGoogleLogin}
            className="p-button-danger w-full"
          />
        </div>
      </div>
      <div className="login-info-message" style={{ marginTop: 12, background: "#fffbe6", border: "1px solid #ffe58f", borderRadius: 6, padding: 16, color: "#614700" }}>
        <strong style={{ display: "block", textAlign: "center" }}>Accesso Volontari</strong><br />
        Questo portale è riservato ai volontari della community e-Nable Italia.<br /><br />

        Chiunque desideri entrare a farne parte può farlo, a condizione di conoscere e accettare le regole della community e il relativo codice etico.
        Tutte le informazioni per i volontari sono disponibili alla pagina dedicata:
        <a
          href="https://e-nableitalia.it/it_it/informazioni-volontari/"
          target="_blank"
          rel="noopener noreferrer"
          style={{ textDecoration: "underline" }}
        >
          Informazioni per i volontari
        </a>.<br /><br />

        
        <span style={{ fontStyle: "italic" }}>
          Puoi accedere con <b>le tue credenziali</b> oppure utilizzando <b>Google</b>.<br /><br />
          Se non sei ancora registrato, puoi creare un account in modo semplice:
          accedendo con <b>"Continua con Google"</b> (registrazione automatica)
          oppure via mail richiedendo il{" "}
          <b
            style={{ cursor: "pointer", textDecoration: "underline" }}
            onClick={() => navigate("/register")}
          >
            link di registrazione nuovo utente
          </b>.
          <br /><br />
          Se invece sei arrivato qui per richiedere un device, non è necessario registrarsi:
          puoi farlo direttamente cliccando sul pulsante <b>"Voglio richiedere un device"</b> qui sotto.
        </span>
      </div>
      <div style={{ textAlign: "center", marginTop: 24 }}>
        <Button
          label="Voglio richiedere un device"
          icon="pi pi-users"
          className="p-button-info"
          onClick={() => navigate("/request-device")}
        />
      </div>
      <footer style={{ marginTop: 40, padding: "16px 0", fontSize: "0.9em", color: "#888", textAlign: "center" }}>
        <div>
          Copyright © 2026 |{" "}
          <a href="https://e-nableitalia.it" target="_blank" rel="noopener noreferrer" style={{ color: "#888", textDecoration: "underline" }}>
            e-Nable Italia
          </a>{" "}
          /{" "}
          <a href="https://energyfamilyproject.org" target="_blank" rel="noopener noreferrer" style={{ color: "#888", textDecoration: "underline" }}>
            Energy Family Project APS
          </a>{" "}
          | CF 96433270582
        </div>
        <div>
          <a href="https://e-nableitalia.it/it_it/privacy-policy-2/" target="_blank" rel="noopener noreferrer" style={{ color: "#888", textDecoration: "underline" }}>
            Privacy Policy
          </a>{" "}
          | Email: <a href="mailto:info@e-nableitalia.it" style={{ color: "#888", textDecoration: "underline" }}>info@e-nableitalia.it</a>
        </div>
      </footer>
    </div>
  );
}
