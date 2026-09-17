import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { UgnayMark } from "@/components/brand/ugnay-mark";

type AuthLayoutProps = {
  /** Small uppercase label above the form title, e.g. "Welcome back". */
  kicker: string;
  title: string;
  description: string;
  /** Small uppercase label inside the brand panel. */
  eyebrow: string;
  brandTitle: string;
  brandCopy: string;
  brandNote: string;
  switchPrompt: string;
  switchTo: string;
  switchLabel: string;
  /** Which side the brand panel sits on. */
  brandSide?: "left" | "right";
  children: ReactNode;
};

function BrandPanel({ eyebrow, brandTitle, brandCopy, brandNote }: Pick<AuthLayoutProps, "eyebrow" | "brandTitle" | "brandCopy" | "brandNote">) {
  return (
    <section className="relative hidden flex-col justify-between overflow-hidden bg-primary p-8 text-primary-foreground lg:flex xl:p-14">
      {/* Decorative concentric rings, token-driven */}
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-40 -right-40 size-96 rounded-full border border-primary-foreground/20" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-52 -right-52 size-[30rem] rounded-full border border-primary-foreground/10" />
      <div aria-hidden="true" className="pointer-events-none absolute -top-24 -left-24 size-56 rounded-full bg-primary-foreground/5" />

      <div className="flex items-center gap-2.5">
        <UgnayMark className="size-9" />
        <span className="text-lg font-semibold tracking-tight">ugnay</span>
      </div>

      <div className="relative max-w-md">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-accent">
          <Sparkles className="size-3.5" aria-hidden="true" />
          {eyebrow}
        </p>
        <h1 className="mt-4 font-heading text-4xl font-semibold leading-tight tracking-tight xl:text-5xl">
          {brandTitle}
        </h1>
        <p className="mt-4 text-base leading-relaxed text-primary-foreground/70">{brandCopy}</p>
      </div>

      <p className="flex items-center gap-2.5 text-sm text-primary-foreground/80">
        <span className="relative flex size-2" aria-hidden="true">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent opacity-60" />
          <span className="relative inline-flex size-2 rounded-full bg-accent" />
        </span>
        {brandNote}
      </p>
    </section>
  );
}

function MobileBrand() {
  return (
    <div className="mb-8 flex items-center gap-2 lg:hidden">
      <UgnayMark className="size-8" />
      <span className="text-lg font-semibold tracking-tight">ugnay</span>
    </div>
  );
}

export function AuthLayout({
  kicker,
  title,
  description,
  eyebrow,
  brandTitle,
  brandCopy,
  brandNote,
  switchPrompt,
  switchTo,
  switchLabel,
  brandSide = "left",
  children,
}: AuthLayoutProps) {
  const formPanel = (
    <section className="flex flex-col items-center justify-center px-4 py-10 sm:px-8 lg:py-16">
      <MobileBrand />
      <Card className="w-full max-w-md">
        <CardHeader>
          <p className="text-xs font-semibold uppercase tracking-widest text-accent">{kicker}</p>
          <CardTitle className="mt-2 font-heading text-2xl font-semibold tracking-tight">{title}</CardTitle>
          <CardDescription className="mt-1">{description}</CardDescription>
        </CardHeader>
        <CardContent>
          {children}
          <p className="mt-6 text-center text-sm text-muted-foreground">
            {switchPrompt}{" "}
            <Link to={switchTo} className="font-medium text-primary underline-offset-4 hover:underline">
              {switchLabel}
            </Link>
          </p>
        </CardContent>
      </Card>
    </section>
  );

  return (
    <main className={cn("grid min-h-screen bg-background lg:min-h-screen lg:grid-cols-2")}>
      {brandSide === "left" ? (
        <>
          <BrandPanel eyebrow={eyebrow} brandTitle={brandTitle} brandCopy={brandCopy} brandNote={brandNote} />
          {formPanel}
        </>
      ) : (
        <>
          {formPanel}
          <BrandPanel eyebrow={eyebrow} brandTitle={brandTitle} brandCopy={brandCopy} brandNote={brandNote} />
        </>
      )}
    </main>
  );
}
