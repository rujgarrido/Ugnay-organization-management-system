import { AuthLayout } from "@/features/auth/components/auth-layout";
import { LoginForm } from "@/features/auth/components/login-form";

export function LoginPage() {
  return (
    <AuthLayout
      kicker="Welcome back"
      title="Log in to your workspace"
      description="Pick up where your team left off."
      eyebrow="Work in sync"
      brandTitle="Bring the moving parts together."
      brandCopy="Ugnay gives your team one calm place to turn plans into progress."
      brandNote="Make room for the work that matters."
      switchPrompt="New to Ugnay?"
      switchTo="/register"
      switchLabel="Create an account"
      brandSide="left"
    >
      <LoginForm />
    </AuthLayout>
  );
}
