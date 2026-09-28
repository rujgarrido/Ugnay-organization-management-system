import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AuthField, AuthFormError } from "./auth-field";
import { loginSchema, type LoginInput } from "../schemas/login-schema";
import { useLogin } from "../hooks/use-login";
import { getApiErrorMessage } from "@/lib/api-error";
import { Loader2, LockKeyhole, Mail } from "lucide-react";

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

      <div className="space-y-1.5">
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
        <div className="flex justify-end">
          <Link
            to="/forgot-password"
            className="text-xs font-medium text-primary underline-offset-4 transition-colors hover:text-primary/80 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 rounded-xs"
          >
            Forgot password?
          </Link>
        </div>
      </div>

      {login.isError && <AuthFormError message={getApiErrorMessage(login.error)} />}

      <Button
        type="submit"
        size="lg"
        className="w-full justify-center transition-all duration-200"
        disabled={login.isPending}
        aria-busy={login.isPending}
      >
        {login.isPending ? (
          <>
            <Loader2 className="animate-spin" data-icon="inline-start" />
            Logging in...
          </>
        ) : (
          "Log in"
        )}
      </Button>
    </form>
  );
}
