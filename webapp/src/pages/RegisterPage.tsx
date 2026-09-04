import { Link } from "react-router-dom";
import { RegisterForm } from "@/features/auth/components/register-form";
import { Sparkles } from "lucide-react";

export function RegisterPage() {
  return (
    <main className="auth-shell auth-shell-register">
      <section className="auth-form-panel">
        <div className="auth-form-wrap">
          <div className="mobile-brand"><span className="brand-word">ugnay</span><span className="brand-dot">.</span></div>
          <p className="form-kicker">Start with Ugnay</p>
          <h2>Create your workspace account</h2>
          <p className="form-intro">A better rhythm for the work ahead.</p>

          <RegisterForm />

          <p className="auth-switch">
            Already have an account? <Link to="/login">Log in</Link>
          </p>
        </div>
      </section>

      <section className="auth-brand-panel">
        <div className="brand-mark"><span>U</span></div>
        <p className="eyebrow"><Sparkles size={14} /> A clearer way forward</p>
        <h1>Good work gets better when it connects.</h1>
        <p className="brand-copy">Bring people, priorities, and progress into the same conversation.</p>
        <div className="brand-note"><span className="status-dot" /><span>Your next chapter starts here.</span></div>
      </section>
    </main>
  );
}