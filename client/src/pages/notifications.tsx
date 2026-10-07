import {
  useListNotifications,
  useMarkAllNotificationsRead,
} from "@/lib/api-client-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  AppPage,
  EmptyState,
  PageHeading,
  SurfaceCard,
} from "@/components/app-ui";
import { Bell, Loader2, ArrowRight, Check, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

export default function Notifications() {
  const {
    data: notifications,
    isLoading,
    isError,
    refetch,
  } = useListNotifications({ query: { queryKey: ["notifications"] } });
  const markAllRead = useMarkAllNotificationsRead();
  const handleMarkAllRead = () =>
    markAllRead.mutate(undefined, { onSuccess: () => refetch() });

  return (
    <div className="min-h-[100dvh] bg-background" dir="rtl">
      <AppPage width="mobile" className="pt-5 sm:pt-8">
        <PageHeading
          eyebrow="مركز التنبيهات"
          title="الإشعارات"
          description="تابع آخر المستجدات والتحديثات المهمة في حسابك."
          action={
            <Link href="/">
              <Button
                variant="outline"
                size="icon"
                className="h-11 w-11 rounded-2xl bg-card"
                aria-label="العودة للرئيسية"
              >
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          }
        />
        <div className="mb-5 flex items-center justify-between gap-3 rounded-2xl border border-accent/20 bg-accent/10 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/20 text-accent-foreground">
              <Bell className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-extrabold text-foreground">
                ابقَ على اطلاع
              </p>
              <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
                يمكنك تعليم كل الإشعارات كمقروءة.
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleMarkAllRead}
            disabled={markAllRead.isPending}
            className="h-10 shrink-0 rounded-xl px-3 text-xs font-bold text-primary hover:bg-card"
          >
            {markAllRead.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="ml-1 h-4 w-4" />
            )}
            <span className="hidden sm:inline">تعليم كمقروء</span>
            <span className="sm:hidden">كمقروء</span>
          </Button>
        </div>
        {isLoading ? (
          <SurfaceCard
            className="space-y-3 p-4 sm:p-5"
            aria-label="جاري تحميل الإشعارات"
          >
            {[1, 2, 3].map(i => (
              <div
                key={i}
                className="flex animate-pulse gap-3 rounded-2xl border border-border/60 p-4"
              >
                <div className="h-10 w-10 shrink-0 rounded-xl bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-2/5 rounded-full bg-muted" />
                  <div className="h-3 w-4/5 rounded-full bg-muted" />
                </div>
              </div>
            ))}
          </SurfaceCard>
        ) : isError ? (
          <EmptyState
            icon={AlertCircle}
            title="تعذر تحميل الإشعارات"
            description="تحقق من اتصالك بالإنترنت ثم حاول مرة أخرى."
            action={
              <Button onClick={() => refetch()} className="rounded-xl">
                إعادة المحاولة
              </Button>
            }
          />
        ) : !notifications || notifications.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="لا يوجد إشعارات"
            description="أنت على اطلاع بكل شيء! ستظهر هنا التحديثات الجديدة."
          />
        ) : (
          <SurfaceCard className="overflow-hidden p-2 sm:p-3">
            <div className="space-y-2">
              {notifications.map(n => (
                <article
                  key={n.id}
                  className={`rounded-2xl border px-4 py-4 ${n.isRead ? "border-border/60 bg-background/60" : "border-primary/15 bg-primary/[0.045]"}`}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${n.isRead ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"}`}
                    >
                      <Bell className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <h2
                          className={`text-sm leading-6 ${n.isRead ? "font-bold text-foreground/80" : "font-extrabold text-foreground"}`}
                        >
                          {n.title}
                        </h2>
                        <time
                          className="shrink-0 pt-0.5 text-[10px] text-muted-foreground"
                          dateTime={n.createdAt}
                        >
                          {format(new Date(n.createdAt), "hh:mm a", {
                            locale: ar,
                          })}
                        </time>
                      </div>
                      <p className="mt-1 text-xs leading-6 text-muted-foreground">
                        {n.body}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </SurfaceCard>
        )}
      </AppPage>
    </div>
  );
}
