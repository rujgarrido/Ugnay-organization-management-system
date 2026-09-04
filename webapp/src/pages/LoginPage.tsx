import { Link } from "react-router-dom";
import { LoginForm } from "@/features/auth/components/login-form";
import { Sparkles } from "lucide-react";

export function LoginPage() {
  return (
    <main className="auth-shell">
      <section className="auth-brand-panel">
        <div className="brand-mark"><span>U</span></div>
        <p className="eyebrow"><Sparkles size={14} /> Work in sync</p>
        <h1>Bring the moving parts together.</h1>
        <p className="brand-copy">Ugnay gives your team one calm place to turn plans into progress.</p>
        <div className="brand-note"><span className="status-dot" /><span>Make room for the work that matters.</span></div>
      </section>

      <section className="auth-form-panel">
        <div className="auth-form-wrap">
          <div className="mobile-brand"><span className="brand-word">ugnay</span><span className="brand-dot">.</span></div>
          <p className="form-kicker">Welcome back</p>
          <h2>Log in to your workspace</h2>
          <p className="form-intro">Pick up where your team left off.</p>

          <LoginForm />

          <p className="auth-switch">
            New to Ugnay? <Link to="/register">Create an account</Link>
          </p>
        </div>
      </section>
    </main>
  );
}