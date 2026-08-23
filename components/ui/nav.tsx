import Link from "next/link";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/icon";
import { Logo } from "@/components/ui/logo";

export function Navbar({
  links,
  className,
}: {
  links: { label: string; href: string; active?: boolean }[];
  className?: string;
}) {
  return (
    <nav className={cn("flex h-14 items-center gap-8", className)}>
      <Link href="/" aria-label="Vertex home">
        <Logo />
      </Link>
      <ul className="flex items-center gap-6">
        {links.map((link) => (
          <li key={link.label}>
            <Link
              href={link.href}
              aria-current={link.active ? "page" : undefined}
              className={cn(
                "text-body font-medium transition-colors",
                link.active
                  ? "text-primary-500"
                  : "text-neutral-700 hover:text-neutral-900",
              )}
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function Breadcrumbs({
  items,
  className,
}: {
  items: { label: string; href?: string }[];
  className?: string;
}) {
  return (
    <ol
      className={cn(
        "flex flex-wrap items-center gap-2 text-small",
        className,
      )}
    >
      {items.map((item, i) => {
        const last = i === items.length - 1;
        return (
          <li key={item.label} className="flex items-center gap-2">
            {last ? (
              <span aria-current="page" className="text-neutral-900">
                {item.label}
              </span>
            ) : (
              <>
                <a
                  href={item.href ?? "#"}
                  className="text-neutral-500 hover:text-primary-500"
                >
                  {item.label}
                </a>
                <Icon
                  name="chevron-right"
                  className="size-3.5 text-neutral-300"
                />
              </>
            )}
          </li>
        );
      })}
    </ol>
  );
}

