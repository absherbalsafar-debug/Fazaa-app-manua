import { useLocation } from "wouter";
import { ArrowRight, CheckCircle2, ShieldCheck } from "lucide-react";
import {
  AppPage,
  PageHeading,
  SectionHeading,
  SurfaceCard,
} from "@/components/app-ui";

const sections = [
  [
    "المعلومات التي نجمعها",
    "نجمع المعلومات التي تقدمها عند إنشاء الحساب مثل الاسم ورقم الهاتف أو البريد الإلكتروني والمدينة. وقد نحتفظ بمعلومات الخدمة والتقييمات والرسائل اللازمة لتشغيل المنصة.",
  ],
  [
    "كيف نستخدم المعلومات",
    "نستخدم بياناتك لتسجيل الدخول، مطابقة العملاء مع مقدمي الخدمة، إدارة الطلبات والرسائل، تحسين الأمان، وإرسال التنبيهات المتعلقة بالخدمات التي طلبتها.",
  ],
  [
    "مشاركة البيانات",
    "لا نبيع بياناتك الشخصية. قد تظهر بعض معلومات الملف المهني للعملاء عند تصفح الخدمات، ولا تتم مشاركة بيانات الاتصال الخاصة إلا عندما يكون ذلك ضرورياً لتنفيذ الطلب.",
  ],
  [
    "حماية الحساب",
    "حافظ على سرية رمز التحقق وكلمة المرور، وأبلغنا فوراً إذا لاحظت استخداماً غير معتاد لحسابك. نستخدم وسائل حماية مناسبة للمعلومات المخزنة لدينا.",
  ],
  [
    "حقوقك",
    "يمكنك طلب تصحيح معلوماتك أو الاستفسار عن طريقة استخدامها أو طلب حذف الحساب وفق المتطلبات القانونية والتشغيلية. تواصل مع فريق الدعم من داخل التطبيق.",
  ],
];

export default function Privacy() {
  const [, navigate] = useLocation();
  return (
    <main className="premium-surface min-h-[100dvh] bg-background" dir="rtl">
      <AppPage width="mobile" className="pt-safe">
        <PageHeading
          eyebrow="فزعة FAZAAH"
          title="سياسة الخصوصية"
          description="نوضح هنا ما نحتاجه لتقديم تجربة آمنة وواضحة."
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
        <SurfaceCard className="mb-7 overflow-hidden bg-primary p-5 text-primary-foreground sm:p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-accent text-primary">
              <ShieldCheck className="h-6 w-6" aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs font-bold text-accent">حماية ووضوح</p>
              <h2 className="mt-1 text-xl font-black">خصوصيتك أولوية</h2>
            </div>
          </div>
        </SurfaceCard>
        <section>
          <SectionHeading
            title="ما تحتاج معرفته"
            description="نستخدم بياناتك بمسؤولية لتشغيل خدمات فزعة وحمايتها."
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
