import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { loginSchema, type LoginInput } from "../schemas/login-schema";
import { useLogin } from "../hooks/use-login";
import { getApiErrorMessage } from "@/lib/api-error";
import { ArrowRight, LockKeyhole, Mail } from "lucide-react";

export function LoginForm() {
  const login = useLogin();
  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  return (
    <form onSubmit={form.handleSubmit((values) => login.mutate(values))} className="auth-form">
      <div className="space-y-2">
        <label htmlFor="email" className="field-label">Email</label>
        <div className="field-with-icon">
          <Mail size={18} />
          <Input id="email" type="email" placeholder="you@company.com" autoComplete="email" aria-invalid={!!form.formState.errors.email} {...form.register("email")} />
        </div>
        {form.formState.errors.email && <p className="field-error">{form.formState.errors.email.message}</p>}
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="field-label">Password</label>
        <div className="field-with-icon">
          <LockKeyhole size={18} />
          <Input id="password" type="password" placeholder="Enter your password" autoComplete="current-password" aria-invalid={!!form.formState.errors.password} {...form.register("password")} />
        </div>
        {form.formState.errors.password && <p className="field-error">{form.formState.errors.password.message}</p>}
      </div>

      {login.isError && <p className="form-error">{getApiErrorMessage(login.error)}</p>}
      <Button type="submit" className="auth-submit" disabled={login.isPending}>
        {login.isPending ? "Logging in..." : <>Log in <ArrowRight size={17} /></>}
      </Button>
    </form>
  );
}