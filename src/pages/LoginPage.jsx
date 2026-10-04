import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import Field from "../components/Field";
import Input from "../components/Input";
import "./LoginPage.css";

export default function LoginPage() {
  const { login, loading } = useAuth();
  const { showError, showSuccess } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (event) => {
    event.preventDefault();
    if (!email.trim()) {
      showError("Preencha o e-mail");
      return;
    }
    if (!password) {
      showError("Preencha a senha");
      return;
    }

    setIsLoading(true);
    try {
      const result = await login(email, password);
      if (!result.ok) {
        const errorMessage = result.error?.message || "Erro ao fazer login";
        showError(
          errorMessage.includes("E-mail ou senha")
            ? "E-mail ou senha incorretos"
            : errorMessage
        );
      } else {
        showSuccess("Login realizado!");
      }
    } catch (error) {
      showError(error.message || "Erro ao fazer login");
    } finally {
      setIsLoading(false);
    }
  };

  const isFormDisabled = isLoading || loading;

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <div className="login-brand">
            <img src="/logo-conserpav.png" alt="Conserpav" className="login-logo" />
            <div className="login-brand-text">
              <h1>CONSER<span className="login-accent">PAV</span></h1>
              <p>Frequência</p>
            </div>
          </div>
        </div>

        <div className="login-card">
          <div className="login-title">
            <h2>Fazer login</h2>
          </div>

          <form className="login-form" onSubmit={handleLogin}>
            <Field label="E-mail" htmlFor="email" required>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={isFormDisabled}
                autoComplete="email"
                required
              />
            </Field>

            <Field label="Senha" htmlFor="password" required>
              <Input
                id="password"
                type="password"
                placeholder="••••••"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={isFormDisabled}
                autoComplete="current-password"
                required
              />
            </Field>

            <button type="submit" className="login-button" disabled={isFormDisabled}>
              {isLoading ? "Entrando…" : "Entrar"}
            </button>

            <div className="login-footer">
              <a href="/?recover=true" className="forgot-password-link">
                Esqueceu a senha?
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
