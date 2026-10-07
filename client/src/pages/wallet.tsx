import { useLocation } from "wouter";
import { ArrowRight, CreditCard, Info, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AppPage,
  EmptyState,
  PageHeading,
  SurfaceCard,
} from "@/components/app-ui";

export default function Wallet() {
  const [, navigate] = useLocation();

  return (
    <div className="app-stage min-h-[100dvh] bg-background" dir="rtl">
      <AppPage width="mobile">
        <PageHeading
          eyebrow="إدارة الحساب"
          title="وسائل الدفع"
          description="إدارة بطاقاتك وأرصدة حسابك بأمان ووضوح."
          action={
            <button
              onClick={() => navigate("/profile")}
              aria-label="العودة إلى الحساب"
              className="flex h-11 w-11 items-center justify-center rounded-2xl border border-border bg-card text-primary shadow-sm transition-colors hover:border-primary/30 hover:bg-primary/5"
            >
              <ArrowRight className="h-5 w-5" />
            </button>
          }
        />

        <SurfaceCard className="p-0">
          <EmptyState
            icon={CreditCard}
            title="لا توجد وسائل دفع محفوظة"
            description="ستتمكن من إضافة وسيلة دفع آمنة عند تفعيل الدفع الإلكتروني."
            action={
              <Button
                variant="outline"
                disabled
                className="min-h-12 w-full rounded-xl border-border font-bold"
              >
                <Plus className="ml-2 h-4 w-4" />
                إضافة وسيلة دفع
              </Button>
            }
            className="border-0 bg-transparent py-8 shadow-none"
          />
        </SurfaceCard>

        <div className="mt-5 flex items-start gap-3 rounded-2xl border border-primary/10 bg-primary/5 p-4 text-primary">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-card text-primary">
            <Info className="h-4 w-4" />
          </span>
          <p className="text-sm leading-6">
            بيانات الدفع لا تُطلب منك داخل التطبيق قبل تفعيل مزود الدفع الرسمي.
          </p>
        </div>
      </AppPage>
    </div>
  );
}
