import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
} from "react";
import { cn } from "@/lib/utils";
import { Icon, type IconName } from "@/components/ui/icon";

/**
 * Field specs (design sheet 08): height 44px, radius 12px,
 * border 1px #E2E8F0, padding 0 16px, focus border #FB923C.
 */
const field =
  "h-11 w-full rounded-md border border-neutral-200 bg-white px-4 text-body " +
  "text-neutral-900 placeholder:text-neutral-500 outline-none transition-colors " +
  "focus:border-primary-400";

export function Input({
  icon,
  kbd,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  icon?: IconName;
  /** Shortcut hint rendered as a key chip on the right, e.g. "⌘ K". */
  kbd?: string;
}) {
  return (
    <div className={cn("relative flex items-center", className)}>
      {icon && (
        <Icon
          name={icon}
          className="pointer-events-none absolute left-4 size-4 text-neutral-500"
        />
      )}
      <input
        className={cn(field, icon && "pl-11", kbd && "pr-16")}
        {...props}
      />
      {kbd && (
        <kbd className="absolute right-3 inline-flex h-6 items-center rounded-xs border border-neutral-200 bg-white px-1.5 font-sans text-small text-neutral-500">
          {kbd}
        </kbd>
      )}
    </div>
  );
}

export function Select({
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className={cn("relative flex items-center", className)}>
      <select className={cn(field, "appearance-none pr-10")} {...props}>
        {children}
      </select>
      <Icon
        name="chevron-down"
        className="pointer-events-none absolute right-3.5 size-4 text-neutral-700"
      />
    </div>
  );
}

export function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <p className="mb-2 text-body font-medium text-neutral-900">{children}</p>
  );
}
