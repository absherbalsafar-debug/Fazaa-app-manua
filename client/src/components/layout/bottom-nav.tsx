import { Link, useLocation } from "wouter";
import { Home, Search, ClipboardList, User, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { motion } from "framer-motion";

export function BottomNav() {
  const [location] = useLocation();
  const { user } = useAuth();

  if (!user) return null;
  if (user.role === "admin") return null;

  const items =
    user.role === "provider"
      ? [
          { href: "/provider-dashboard", icon: Home, label: "لوحتي" },
          { href: "/my-requests", icon: ClipboardList, label: "الطلبات" },
          { href: "/profile", icon: User, label: "ملفي" },
          { href: "/settings", icon: Settings2, label: "الإعدادات" },
        ]
      : [
          { href: "/", icon: Home, label: "الرئيسية" },
          { href: "/providers", icon: Search, label: "استعرض" },
          { href: "/my-requests", icon: ClipboardList, label: "طلباتي" },
          { href: "/profile", icon: User, label: "حسابي" },
        ];

  return (
    <nav
      aria-label="التنقل الرئيسي"
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/80 bg-card/95 pb-safe backdrop-blur-2xl"
      style={{ boxShadow: "0 -8px 28px rgba(14,47,98,0.08)" }}
    >
      <div className="mx-auto flex h-[68px] max-w-2xl items-center justify-around px-2">
        {items.map(item => {
          const isActive =
            item.href === "/"
              ? location === "/"
              : location.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className="relative flex h-full min-w-0 flex-1 flex-col items-center justify-center gap-0.5"
            >
              <div className="relative flex flex-col items-center gap-0.5 px-3 py-1">
                {isActive && (
                  <>
                    <motion.div
                      layoutId="nav-active"
                      className="absolute inset-0 rounded-2xl bg-primary/10"
                      transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 35,
                      }}
                    />
                    <span
                      className="absolute -top-1 h-1 w-5 rounded-full bg-accent"
                      aria-hidden="true"
                    />
                  </>
                )}
                <Icon
                  className={cn(
                    "relative h-5 w-5 transition-all duration-200",
                    isActive ? "text-primary" : "text-muted-foreground/75"
                  )}
                  strokeWidth={isActive ? 2.5 : 1.8}
                />
                <span
                  className={cn(
                    "relative text-[11px] font-bold leading-none transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground/75"
                  )}
                >
                  {item.label}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
