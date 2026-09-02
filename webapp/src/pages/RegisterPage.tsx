import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router-dom";
import { registerSchema, type RegisterInput } from "@/features/auth/schemas";
import { useRegister } from "@/features/auth/useAuthMutations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, LockKeyhole, Mail, Sparkles, UserRound } from "lucide-react";

export function RegisterPage() {
  const register = useRegister();

  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  function onSubmit(values: RegisterInput) {
    register.mutate(values);
  }

  return (
    <main className="auth-shell auth-shell-register">
      <section className="auth-form-panel">
        <div className="auth-form-wrap">
          <div className="mobile-brand"><span className="brand-word">ugnay</span><span className="brand-dot">.</span></div>
          <p className="form-kicker">Start with Ugnay</p>
          <h2>Create your workspace account</h2>
          <p className="form-intro">A better rhythm for the work ahead.</p>

          <form onSubmit={form.handleSubmit(onSubmit)} className="auth-form">
            <div className="name-fields">
              <div className="flex-1 space-y-2">
                <label htmlFor="firstName" className="field-label">
                  First name
                </label>
                <div className="field-with-icon"><UserRound size={18} /><Input id="firstName" placeholder="Ada" autoComplete="given-name" {...form.register("firstName")} /></div>
                {form.formState.errors.firstName && (
                  <p className="text-sm text-red-600">
                    {form.formState.errors.firstName.message}
                  </p>
                )}
              </div>

              <div className="flex-1 space-y-2">
                <label htmlFor="lastName" className="field-label">
                  Last name
                </label>
                <div className="field-with-icon"><UserRound size={18} /><Input id="lastName" placeholder="Lovelace" autoComplete="family-name" {...form.register("lastName")} /></div>
                {form.formState.errors.lastName && (
                  <p className="text-sm text-red-600">
                    {form.formState.errors.lastName.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="field-label">
                Email
              </label>
              <div className="field-with-icon"><Mail size={18} /><Input id="email" type="email" placeholder="you@company.com" autoComplete="email" {...form.register("email")} /></div>
              {form.formState.errors.email && (
                <p className="text-sm text-red-600">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="field-label">
                Password
              </label>
              <div className="field-with-icon"><LockKeyhole size={18} /><Input id="password" type="password" placeholder="At least 8 characters" autoComplete="new-password" {...form.register("password")} /></div>
              {form.formState.errors.password && (
                <p className="text-sm text-red-600">
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="field-label">
                Confirm password
              </label>
              <div className="field-with-icon"><LockKeyhole size={18} /><Input id="confirmPassword" type="password" placeholder="Repeat your password" autoComplete="new-password" {...form.register("confirmPassword")} /></div>
              {form.formState.errors.confirmPassword && (
                <p className="text-sm text-red-600">
                  {form.formState.errors.confirmPassword.message}
                </p>
              )}
            </div>

            {register.isError && (
              <p className="form-error">{getErrorMessage(register.error)}</p>
            )}

            <Button type="submit" className="auth-submit" disabled={register.isPending}>
              {register.isPending ? "Creating account..." : <>Create account <ArrowRight size={17} /></>}
            </Button>
          </form>

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

function getErrorMessage(error: unknown): string {
  if (typeof error === "object" && error && "response" in error) {
    const response = (error as { response?: { data?: { message?: string } } })
      .response;
    if (response?.data?.message) return response.data.message;
  }
  return "Something went wrong. Please try again.";
}