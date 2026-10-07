import { useLocation } from "wouter";
import { ArrowRight, CheckCircle2, ScrollText } from "lucide-react";
import {
  AppPage,
  PageHeading,
  SectionHeading,
  SurfaceCard,
} from "@/components/app-ui";

const sections = [
  [
    "قبول الشروط",
    "باستخدام فزعة، تقر بأنك قرأت هذه الشروط وتوافق على الالتزام بها. إذا لم توافق عليها، يرجى عدم استخدام الخدمات.",
  ],
  [
    "الحسابات",
    "يجب تقديم معلومات صحيحة والمحافظة على سرية بيانات الدخول. الحساب شخصي، وأنت مسؤول عن النشاط الذي يتم من خلاله.",
  ],
  [
    "مقدمو الخدمة",
    "يلتزم مقدم الخدمة بوصف خدماته بدقة، احترام العملاء، الالتزام بالمواعيد المتفق عليها، وعدم تقديم أعمال مخالفة للأنظمة أو السلامة.",
  ],
  [
    "العملاء والطلبات",
    "على العميل وصف احتياجه بوضوح واحترام مقدم الخدمة. تفاصيل السعر والموعد ونطاق العمل يجب أن تُتفق عليها داخل الطلب قبل التنفيذ.",
  ],
  [
    "المحتوى والسلوك",
    "يُمنع استخدام فزعة للإساءة أو الاحتيال أو نشر محتوى مخالف أو جمع بيانات الآخرين دون إذن. قد نوقف الحساب عند وجود مخالفة واضحة.",
  ],
  [
    "الدفع والتحديثات",
    "قد نضيف خدمات دفع أو ميزات جديدة لاحقاً. سنوضح أي رسوم أو شروط مرتبطة بها قبل استخدامها، وقد نحدّث هذه الشروط عند الحاجة.",
  ],
];

export default function Terms() {
  const [, navigate] = useLocation();
  return (
    <main className="premium-surface min-h-[100dvh] bg-background" dir="rtl">
      <AppPage width="mobile" className="pt-safe">
        <PageHeading
          eyebrow="فزعة FAZAAH"
          title="شروط الاستخدام"
          description="تهدف هذه الشروط إلى تنظيم العلاقة بين العملاء ومقدمي الخدمات."
          action={
            <button
              type="button"
              onClick={() => navigate("/settings")}
              className="flex h-11 w-11 items-center justify-center rounded-2xl border border-border bg-card text-foreground shadow-sm transition hover:border-primary/30 hover:bg-muted"
              aria-label="العودة إلى الإعدادات"
            >
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </button>
          }
          className="mb-5"
        />
        <SurfaceCard className="mb-7 overflow-hidden border-accent/30 bg-accent/10 p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-accent">
              <ScrollText className="h-6 w-6" aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs font-bold text-accent-foreground">
                استخدام مسؤول
              </p>
              <h2 className="mt-1 text-xl font-black text-primary">
                شروط واضحة للجميع
              </h2>
            </div>
          </div>
        </SurfaceCard>
        <section>
          <SectionHeading
            title="بنود الاستخدام"
            description="اقرأ البنود التالية لمعرفة حقوقك ومسؤولياتك داخل فزعة."
            className="px-1"
          />
          <div className="space-y-3">
            {sections.map(([title, text]) => (
              <SurfaceCard as="article" key={title} className="p-5 sm:p-6">
                <div className="flex items-start gap-3">
                  <span className="app-icon-tile h-10 w-10 rounded-2xl">
                    <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-base font-extrabold">{title}</h3>
                    <p className="mt-2 text-sm leading-7 text-muted-foreground">
                      {text}
                    </p>
                  </div>
                </div>
              </SurfaceCard>
            ))}
          </div>
        </section>
        <p className="pt-6 text-center text-xs text-muted-foreground">
          آخر تحديث: 6 سبتمبر 2026
        </p>
      </AppPage>
    </main>
  );
}
