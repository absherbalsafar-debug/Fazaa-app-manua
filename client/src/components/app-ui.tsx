import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const pageWidths = {
  mobile: "max-w-xl",
  content: "max-w-4xl",
  wide: "max-w-7xl",
  full: "max-w-none",
} as const;

export function AppPage({
  children,
  width = "content",
  className,
}: {
  children: ReactNode;
  width?: keyof typeof pageWidths;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-4 pb-28 pt-5 sm:px-6 sm:pt-8 lg:px-8",
        pageWidths[width],
        className
      )}
    >
      {children}
    </div>
  );
}

export function PageHeading({
  title,
  description,
  eyebrow,
  action,
  className,
}: {
  title: string;
  description?: string;
  eyebrow?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn("mb-6 flex items-start justify-between gap-4", className)}
    >
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-1 text-xs font-extrabold text-accent-foreground">
            {eyebrow}
          </p>
        )}
        <h1 className="text-2xl font-black leading-tight tracking-tight text-foreground sm:text-3xl">
          {title}
        </h1>
        {description && (
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function SectionHeading({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-3 flex items-end justify-between gap-3", className)}>
      <div>
        <h2 className="text-base font-extrabold tracking-tight text-foreground sm:text-lg">
          {title}
        </h2>
        {description && (
          <p className="mt-1 text-sm leading-5 text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function SurfaceCard({
  children,
  className,
  as: Element = "section",
}: {
  children: ReactNode;
  className?: string;
  as?: "section" | "div" | "article";
}) {
  return (
    <Element className={cn("app-surface-card", className)}>{children}</Element>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card/70 px-6 py-10 text-center",
        className
      )}
    >
      {Icon && (
        <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/8 text-primary">
          <Icon className="h-6 w-6" aria-hidden="true" />
        </span>
      )}
      <h3 className="text-base font-extrabold text-foreground">{title}</h3>
      {description && (
        <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
