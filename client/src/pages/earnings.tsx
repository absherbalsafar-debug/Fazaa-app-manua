import { useLocation } from "wouter";
import { ArrowRight, Clock3, Info, ReceiptText, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AppPage,
  EmptyState,
  PageHeading,
  SectionHeading,
  SurfaceCard,
} from "@/components/app-ui";

export default function Earnings() {
  const [, navigate] = useLocation();

  return (
    <main
      className="app-stage premium-surface min-h-[100dvh] bg-background"
      dir="rtl"
    >
      <AppPage width="mobile" className="pt-4 sm:pt-8">
        <PageHeading
          title="أرباحي"
          description="الرصيد وعمليات السحب"
          action={
            <button
              type="button"
              onClick={() => navigate("/profile")}
              aria-label="العودة إلى الملف الشخصي"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-border bg-card text-primary shadow-sm transition hover:border-primary/40"
            >
              <ArrowRight className="h-5 w-5" />
            </button>
          }
          className="items-center"
        />

        <SurfaceCard className="relative mb-6 overflow-hidden border-primary/0 bg-primary p-6 text-primary-foreground shadow-[0_18px_36px_rgba(14,47,98,0.18)] sm:p-7">
          <div
            className="absolute -left-12 -top-16 h-36 w-36 rounded-full bg-accent/15 blur-2xl"
            aria-hidden="true"
          />
          <div className="relative">
            <div className="flex items-center gap-2 text-white/70">
              <Wallet className="h-4 w-4" />
              <span className="text-sm">الرصيد المتاح</span>
            </div>
            <p className="mt-5 text-4xl font-black tracking-tight">
              ٠ <span className="text-xl">ر.ي</span>
            </p>
            <p className="mt-2 text-xs leading-5 text-white/65">
              ستظهر الأرباح بعد اكتمال أول طلب مدفوع.
            </p>
          </div>
        </SurfaceCard>

        <SurfaceCard className="mb-6 flex items-start gap-3 p-5 sm:p-6">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-accent/15 text-accent-foreground">
            <Clock3 className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-extrabold">الأرباح قيد التفعيل</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              سيتم تفعيل المحفظة والسحب الإلكتروني عند جاهزية نظام الدفع.
            </p>
          </div>
        </SurfaceCard>

        <section>
          <SectionHeading
            title="العمليات المالية"
            description="تابع الرصيد وعمليات السحب من مكان واحد."
          />
          <EmptyState
            icon={ReceiptText}
            title="لا توجد عمليات مالية حالياً"
            description="سيتم عرض تفاصيل العمليات هنا عند تفعيل نظام الدفع."
            className="py-9"
          />
        </section>

        <div className="mt-5 flex items-start gap-2 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-blue-900 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-100">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <p className="text-xs leading-5">
            لا توجد عمليات مالية حالياً، ولن يتم عرض أرقام تجريبية على حسابك.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => navigate("/provider-dashboard")}
          className="mt-5 h-12 w-full rounded-2xl"
        >
          العودة إلى لوحتي
        </Button>
      </AppPage>
    </main>
  );
}
