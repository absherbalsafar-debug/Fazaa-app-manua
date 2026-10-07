import { useListConversations } from "@/lib/api-client-react";
import { Link } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AppPage,
  EmptyState,
  PageHeading,
  SurfaceCard,
} from "@/components/app-ui";
import { MessageSquare, Search, Edit, AlertCircle } from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";
import { ar } from "date-fns/locale";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { motion } from "framer-motion";

function formatMsgTime(dateStr?: string | null) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isToday(d)) return format(d, "hh:mm a", { locale: ar });
  if (isYesterday(d)) return "أمس";
  return format(d, "MM/dd", { locale: ar });
}

export default function Messages() {
  const {
    data: conversations,
    isLoading,
    isError,
    refetch,
  } = useListConversations({ query: { queryKey: ["conversations"] } });
  const [search, setSearch] = useState("");
  const filtered = (conversations ?? []).filter(
    c =>
      !search || c.otherUserName?.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <div className="min-h-[100dvh] bg-background" dir="rtl">
      <AppPage width="mobile" className="pt-5 sm:pt-8">
        <PageHeading
          eyebrow="تواصل بثقة"
          title="الرسائل"
          description="كل محادثاتك مع المهنيين في مكان واحد."
          action={
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-11 w-11 rounded-2xl bg-card"
              aria-label="رسالة جديدة"
            >
              <Edit className="h-4.5 w-4.5" />
            </Button>
          }
        />
        <SurfaceCard className="mb-6 p-3 sm:p-4">
          <label
            htmlFor="conversation-search"
            className="mb-2 block text-xs font-bold text-muted-foreground"
          >
            البحث في المحادثات
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="conversation-search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="ابحث باسم الشخص..."
              className="h-12 rounded-xl border-border/70 bg-background pr-10 pl-4 text-sm"
            />
          </div>
        </SurfaceCard>
        {isLoading ? (
          <SurfaceCard
            className="space-y-1 p-2 sm:p-3"
            aria-label="جاري تحميل المحادثات"
          >
            {[1, 2, 3, 4].map(i => (
              <div
                key={i}
                className="flex animate-pulse items-center gap-3 rounded-2xl px-3 py-4"
              >
                <div className="h-14 w-14 shrink-0 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-2/5 rounded-full bg-muted" />
                  <div className="h-3 w-3/5 rounded-full bg-muted" />
                </div>
              </div>
            ))}
          </SurfaceCard>
        ) : isError ? (
          <EmptyState
            icon={AlertCircle}
            title="تعذر تحميل المحادثات"
            description="تحقق من اتصالك بالإنترنت ثم حاول مرة أخرى."
            action={
              <Button onClick={() => refetch()} className="rounded-xl">
                إعادة المحاولة
              </Button>
            }
          />
        ) : !filtered.length ? (
          <EmptyState
            icon={MessageSquare}
            title={search ? "لا توجد نتائج للبحث" : "لا توجد رسائل"}
            description={
              search
                ? "جرّب البحث باسم مختلف."
                : "تواصل مع المهنيين بعد طلب خدمة لتبدأ محادثتك."
            }
          />
        ) : (
          <SurfaceCard className="overflow-hidden p-2 sm:p-3">
            <div className="divide-y divide-border/60">
              {filtered.map((conv, i) => (
                <Link key={conv.id} href={`/messages/${conv.otherUserId}`}>
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="flex min-h-[78px] cursor-pointer items-center gap-3 rounded-2xl px-3 py-3 transition-colors hover:bg-muted/40 focus-visible:bg-muted/40"
                  >
                    <div className="relative shrink-0">
                      <Avatar className="h-14 w-14 border border-border/80">
                        <AvatarImage src={conv.otherUserAvatarUrl || ""} />
                        <AvatarFallback className="bg-primary/10 text-base font-extrabold text-primary">
                          {conv.otherUserName?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                      {conv.unreadCount > 0 && (
                        <span
                          className="absolute -left-0.5 -top-0.5 h-4 w-4 rounded-full border-2 border-card bg-accent"
                          aria-label="رسائل جديدة"
                        />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-baseline justify-between gap-2">
                        <h2
                          className={`truncate text-sm ${conv.unreadCount > 0 ? "font-extrabold" : "font-bold"} text-foreground`}
                        >
                          {conv.otherUserName}
                        </h2>
                        <time className="shrink-0 text-[10px] text-muted-foreground">
                          {formatMsgTime(conv.updatedAt)}
                        </time>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <p
                          className={`truncate text-xs ${conv.unreadCount > 0 ? "font-semibold text-foreground" : "text-muted-foreground"}`}
                        >
                          {conv.lastMessage || "صورة 📷"}
                        </p>
                        {conv.unreadCount > 0 && (
                          <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-extrabold text-primary-foreground">
                            {conv.unreadCount > 99 ? "99+" : conv.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>
          </SurfaceCard>
        )}
      </AppPage>
    </div>
  );
}
