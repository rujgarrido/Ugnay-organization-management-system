import { useForm, type UseFormRegisterReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { registerSchema, type RegisterInput } from "../schemas/register-schema";
import { useRegister } from "../hooks/use-register";
import { getApiErrorMessage } from "@/lib/api-error";
import { ArrowRight, LockKeyhole, Mail, UserRound } from "lucide-react";
import type { ReactNode } from "react";

export function RegisterForm() {
  const register = useRegister();
  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { firstName: "", lastName: "", email: "", password: "", confirmPassword: "" },
  });

  return (
    <form onSubmit={form.handleSubmit((values) => register.mutate(values))} className="auth-form">
      <div className="name-fields">
        <Field label="First name" id="firstName" placeholder="Ada" autoComplete="given-name" icon={<UserRound size={18} />} register={form.register("firstName")} error={form.formState.errors.firstName?.message} />
        <Field label="Last name" id="lastName" placeholder="Lovelace" autoComplete="family-name" icon={<UserRound size={18} />} register={form.register("lastName")} error={form.formState.errors.lastName?.message} />
      </div>
      <Field label="Email" id="email" type="email" placeholder="you@company.com" autoComplete="email" icon={<Mail size={18} />} register={form.register("email")} error={form.formState.errors.email?.message} />
      <Field label="Password" id="password" type="password" placeholder="At least 8 characters" autoComplete="new-password" icon={<LockKeyhole size={18} />} register={form.register("password")} error={form.formState.errors.password?.message} />
      <Field label="Confirm password" id="confirmPassword" type="password" placeholder="Repeat your password" autoComplete="new-password" icon={<LockKeyhole size={18} />} register={form.register("confirmPassword")} error={form.formState.errors.confirmPassword?.message} />

      {register.isError && <p className="form-error">{getApiErrorMessage(register.error)}</p>}
      <Button type="submit" className="auth-submit" disabled={register.isPending}>
        {register.isPending ? "Creating account..." : <>Create account <ArrowRight size={17} /></>}
      </Button>
    </form>
  );
}

type FieldProps = {
  label: string;
  id: keyof RegisterInput;
  type?: string;
  placeholder: string;
  autoComplete: string;
  icon: ReactNode;
  register: UseFormRegisterReturn;
  error?: string;
};

function Field({ label, id, type = "text", placeholder, autoComplete, icon, register, error }: FieldProps) {
  return (
    <div className="flex-1 space-y-2">
      <label htmlFor={id} className="field-label">{label}</label>
      <div className="field-with-icon">{icon}<Input id={id} type={type} placeholder={placeholder} autoComplete={autoComplete} aria-invalid={!!error} {...register} /></div>
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}