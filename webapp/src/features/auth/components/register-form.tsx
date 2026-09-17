import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { AuthField, AuthFormError } from "./auth-field";
import { registerSchema, type RegisterInput } from "../schemas/register-schema";
import { useRegister } from "../hooks/use-register";
import { getApiErrorMessage } from "@/lib/api-error";
import { ArrowRight, Loader2, LockKeyhole, Mail, UserRound } from "lucide-react";

export function RegisterForm() {
  const register = useRegister();
  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { firstName: "", lastName: "", email: "", password: "", confirmPassword: "" },
  });

  return (
    <form onSubmit={form.handleSubmit((values) => register.mutate(values))} className="grid gap-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <AuthField
          label="First name"
          id="firstName"
          placeholder="Firstname"
          autoComplete="given-name"
          icon={<UserRound />}
          registration={form.register("firstName")}
          error={form.formState.errors.firstName?.message}
        />
        <AuthField
          label="Last name"
          id="lastName"
          placeholder="Lastname"
          autoComplete="family-name"
          icon={<UserRound />}
          registration={form.register("lastName")}
          error={form.formState.errors.lastName?.message}
        />
      </div>

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
        placeholder="At least 8 characters"
        autoComplete="new-password"
        icon={<LockKeyhole />}
        registration={form.register("password")}
        error={form.formState.errors.password?.message}
      />

      <AuthField
        label="Confirm password"
        id="confirmPassword"
        type="password"
        placeholder="Repeat your password"
        autoComplete="new-password"
        icon={<LockKeyhole />}
        registration={form.register("confirmPassword")}
        error={form.formState.errors.confirmPassword?.message}
      />

      {register.isError && <AuthFormError message={getApiErrorMessage(register.error)} />}

      <Button type="submit" size="lg" className="w-full" disabled={register.isPending} aria-busy={register.isPending}>
        {register.isPending ? (
          <>
            <Loader2 className="animate-spin" data-icon="inline-start" />
            Creating account...
          </>
        ) : (
          <>
            <ArrowRight data-icon="inline-end" />
            Create account
          </>
        )}
      </Button>
    </form>
  );
}
