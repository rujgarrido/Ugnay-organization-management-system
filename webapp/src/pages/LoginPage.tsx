import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router-dom";
import { loginSchema, type LoginInput } from "@/features/auth/schemas";
import { useLogin } from "@/features/auth/useAuthMutations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, LockKeyhole, Mail, Sparkles } from "lucide-react";

export function LoginPage() {
  const login = useLogin();

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  function onSubmit(values: LoginInput) {
    login.mutate(values);
  }

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

          <form onSubmit={form.handleSubmit(onSubmit)} className="auth-form">
            <div className="space-y-2">
              <label htmlFor="email" className="field-label">
                Email
              </label>
              <div className="field-with-icon"><Mail size={18} /><Input id="email" type="email" placeholder="you@company.com" autoComplete="email" {...form.register("email")} /></div>
              {form.formState.errors.email && (
                <p className="field-error">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="field-label">
                Password
              </label>
              <div className="field-with-icon"><LockKeyhole size={18} /><Input id="password" type="password" placeholder="Enter your password" autoComplete="current-password" {...form.register("password")} /></div>
              {form.formState.errors.password && (
                <p className="field-error">
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>

            {login.isError && (
              <p className="form-error">{getErrorMessage(login.error)}</p>
            )}

            <Button type="submit" className="auth-submit" disabled={login.isPending}>
              {login.isPending ? "Logging in..." : <>Log in <ArrowRight size={17} /></>}
            </Button>
          </form>

          <p className="auth-switch">
            New to Ugnay? <Link to="/register">Create an account</Link>
          </p>
        </div>
      </section>
    </main>
  );
}

function getErrorMessage(error: unknown): string {
  if (typeof error === "object" && error && "response" in error) {
    const response = (error as { response?: { data?: { message?: string } } })
      .response;
    if (response?.data?.message) return response.data.message;
  }
  return "Something went wrong. Please try again.";
}