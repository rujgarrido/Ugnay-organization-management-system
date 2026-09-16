import { AuthLayout } from "@/features/auth/components/auth-layout";
import { RegisterForm } from "@/features/auth/components/register-form";

export function RegisterPage() {
  return (
    <AuthLayout
      kicker="Start with Ugnay"
      title="Create your workspace account"
      description="A better rhythm for the work ahead."
      eyebrow="A clearer way forward"
      brandTitle="Good work gets better when it connects."
      brandCopy="Bring people, priorities, and progress into the same conversation."
      brandNote="Your next chapter starts here."
      switchPrompt="Already have an account?"
      switchTo="/login"
      switchLabel="Log in"
      brandSide="right"
    >
      <RegisterForm />
    </AuthLayout>
  );
}
