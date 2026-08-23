import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "tertiary" | "text";
type Size = "md" | "lg";
/** Forces a visual state — used to document states statically (design sheet). */
type VisualState = "default" | "hover" | "disabled";

const base =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-colors " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-400";

const sizes: Record<Size, string> = {
  md: "h-11 px-3 text-body", /* 44px · 0 12px · Inter Medium 14 */
  lg: "h-11 px-4 text-body-lg", /* 44px · 0 16px · Inter Medium 16 */
};

const variants: Record<Variant, Record<VisualState, string>> = {
  primary: {
    default: "bg-primary-500 text-white shadow-sm hover:bg-primary-600",
    hover: "bg-primary-600 text-white shadow-sm",
    disabled: "bg-primary-100 text-primary-300",
  },
  secondary: {
    default:
      "border border-primary-500 bg-white text-primary-500 hover:border-primary-400 hover:bg-primary-50",
    hover: "border border-primary-400 bg-primary-50 text-primary-500",
    disabled: "border border-primary-200 bg-white text-primary-300",
  },
  tertiary: {
    default:
      "border border-neutral-200 bg-white text-neutral-900 hover:border-neutral-300 hover:bg-neutral-50",
    hover: "border border-neutral-300 bg-neutral-50 text-neutral-900",
    disabled: "border border-neutral-100 bg-white text-neutral-300",
  },
  text: {
    default: "text-primary-500 hover:text-primary-600",
    hover: "text-primary-600",
    disabled: "text-primary-200",
  },
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  visualState?: VisualState;
}

export function Button({
  variant = "primary",
  size = "lg",
  visualState = "default",
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || visualState === "disabled"}
      className={cn(
        base,
        sizes[size],
        variants[variant][visualState],
        "disabled:cursor-not-allowed",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
