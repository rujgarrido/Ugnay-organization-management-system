import type * as React from "react";
import { UserRound } from "lucide-react";
import { cn, getAvatarTone, getInitials } from "@/lib/utils";

export interface InitialAvatarProps extends React.ComponentProps<"span"> {
  /** Name or label to compute initials and consistent color from. */
  name: string;
  /** Optional custom seed to hash (defaults to name). E.g. user id or email. */
  seed?: string;
  /** Size class. Defaults to "size-8 text-xs". */
  sizeClassName?: string;
}

/**
 * Accessible circular account/initials avatar.
 * Colors are deterministically hashed from the user's name/seed across
 * an 8-tone palette where every pair satisfies WCAG AA (>= 4.5:1 text contrast)
 * in both light and dark mode.
 */
export function InitialAvatar({
  name,
  seed,
  sizeClassName = "size-8 text-xs",
  className,
  ...props
}: InitialAvatarProps) {
  const initials = getInitials(name);
  const tone = getAvatarTone(seed || name);

  return (
    <span
      data-slot="initial-avatar"
      aria-hidden="true"
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-semibold select-none",
        sizeClassName,
        tone,
        className
      )}
      {...props}
    >
      {initials || <UserRound className="size-1/2" aria-hidden="true" />}
    </span>
  );
}
