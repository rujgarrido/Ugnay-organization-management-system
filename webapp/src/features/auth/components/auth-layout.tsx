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
  /** Illustration rendered in the brand panel. Defaults to the asset in webapp/public. */
  illustrationSrc?: string;
  children: ReactNode;
};

function BrandPanel({
  eyebrow,
  brandTitle,
  brandCopy,
  brandNote,
  illustrationSrc = "/illustration.svg",
}: Pick<
  AuthLayoutProps,
  "eyebrow" | "brandTitle" | "brandCopy" | "brandNote" | "illustrationSrc"
>) {
  return (
    <section className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-[#3B74E0] via-[#2B5CC6] to-[#1E3FA0] p-8 text-white lg:flex xl:p-12">
      {/* Decorative concentric brand rings — polished contrast for intentional, premium brand graphics */}
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-40 -right-40 size-96 rounded-full border-2 border-white/25 shadow-[0_0_80px_rgba(255,255,255,0.08)]" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-52 -right-52 size-[30rem] rounded-full border border-white/20" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-64 -right-64 size-[40rem] rounded-full border border-white/10" />
      <div aria-hidden="true" className="pointer-events-none absolute -top-24 -left-24 size-56 rounded-full bg-white/10 blur-2xl" />

      {/* Top brand identity with original untouched logo */}
      <div className="flex items-center gap-2.5">
        <UgnayMark className="size-9 drop-shadow-xs" />
        <span className="text-lg font-semibold tracking-tight text-white">Ugnay</span>
      </div>

      {/* Headline & copy */}
      <div className="relative z-10 mt-6 max-w-md">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-white/80">
          <Sparkles className="size-3.5" aria-hidden="true" />
          {eyebrow}
        </p>
        <h1 className="mt-3 font-heading text-3xl font-semibold leading-tight tracking-tight text-white xl:text-4xl">
          {brandTitle}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-white/85 xl:text-base">{brandCopy}</p>
      </div>

      {/* Strategic Illustration with ambient soft highlight */}
      <div className="relative my-auto flex w-full items-center justify-center py-4">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-8 top-1/2 h-44 -translate-y-1/2 rounded-full bg-white/15 blur-2xl"
        />
        <img
          src={illustrationSrc}
          alt=""
          aria-hidden="true"
          className="relative max-h-[260px] w-full max-w-[420px] object-contain drop-shadow-[0_16px_32px_rgba(15,35,80,0.35)] transition-transform duration-500 hover:scale-[1.02]"
        />
      </div>

      {/* Bottom live indicator & note */}
      <p className="relative z-10 flex items-center gap-2.5 text-sm text-white/90">
        <span className="relative flex size-2" aria-hidden="true">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-white opacity-60" />
          <span className="relative inline-flex size-2 rounded-full bg-white" />
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
      <span className="text-lg font-semibold tracking-tight">Ugnay</span>
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
  illustrationSrc,
  children,
}: AuthLayoutProps) {
  const formPanel = (
    <section className="flex flex-col items-center justify-center px-4 py-10 sm:px-8 lg:py-16">
      <MobileBrand />
      <Card className="w-full max-w-md shadow-sm">
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
    <main className={cn("grid min-h-screen bg-gradient-to-br from-background via-background to-secondary/40 lg:grid-cols-2")}>
      {brandSide === "left" ? (
        <>
          <BrandPanel
            eyebrow={eyebrow}
            brandTitle={brandTitle}
            brandCopy={brandCopy}
            brandNote={brandNote}
            illustrationSrc={illustrationSrc}
          />
          {formPanel}
        </>
      ) : (
        <>
          {formPanel}
          <BrandPanel
            eyebrow={eyebrow}
            brandTitle={brandTitle}
            brandCopy={brandCopy}
            brandNote={brandNote}
            illustrationSrc={illustrationSrc}
          />
        </>
      )}
    </main>
  );
}
