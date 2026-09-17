import type { ReactNode } from "react";
import type { UseFormRegisterReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type AuthFieldProps = {
  label: string;
  id: string;
  type?: string;
  placeholder: string;
  autoComplete: string;
  icon: ReactNode;
  registration: UseFormRegisterReturn;
  error?: string;
};

/** Shared labelled input with leading icon, used by the login and register forms. */
export function AuthField({ label, id, type = "text", placeholder, autoComplete, icon, registration, error }: AuthFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground [&_svg]:size-4" aria-hidden="true">
          {icon}
        </span>
        <Input
          id={id}
          type={type}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="h-10 pl-9"
          aria-invalid={!!error}
          {...registration}
        />
      </div>
      {error && (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function AuthFormError({ message }: { message: string }) {
  return (
    <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
      {message}
    </div>
  );
}
