import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { AuthField, AuthFormError } from "./auth-field";
import { loginSchema, type LoginInput } from "../schemas/login-schema";
import { useLogin } from "../hooks/use-login";
import { getApiErrorMessage } from "@/lib/api-error";
import { ArrowRight, Loader2, LockKeyhole, Mail } from "lucide-react";

export function LoginForm() {
  const login = useLogin();
  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  return (
    <form onSubmit={form.handleSubmit((values) => login.mutate(values))} className="grid gap-4" noValidate>
      <AuthField
        label="Email"
        id="email"
        type="email"
        placeholder="you@company.com"
        autoComplete="email"
        icon={<Mail />}
        registration={form.register("email")}
        error={form.formState.errors.email?.message}
      />

      <AuthField
        label="Password"
        id="password"
        type="password"
        placeholder="Enter your password"
        autoComplete="current-password"
        icon={<LockKeyhole />}
        registration={form.register("password")}
        error={form.formState.errors.password?.message}
      />

      {login.isError && <AuthFormError message={getApiErrorMessage(login.error)} />}

      <Button type="submit" size="lg" className="w-full" disabled={login.isPending} aria-busy={login.isPending}>
        {login.isPending ? (
          <>
            <Loader2 className="animate-spin" data-icon="inline-start" />
            Logging in...
          </>
        ) : (
          <>
            <ArrowRight data-icon="inline-end" />
            Log in
          </>
        )}
      </Button>
    </form>
  );
}
