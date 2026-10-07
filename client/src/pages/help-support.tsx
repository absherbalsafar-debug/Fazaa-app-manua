import { useState } from "react";
import { useLocation } from "wouter";
import {
  ArrowRight,
  ChevronDown,
  HelpCircle,
  MessageCircle,
  Mail,
  ShieldCheck,
} from "lucide-react";
import {
  AppPage,
  PageHeading,
  SectionHeading,
  SurfaceCard,
} from "@/components/app-ui";

const faqs = [
  {
    q: "كيف أطلب خدمة من مهني؟",
    a: "افتح الرئيسية أو اكتشف المهنيين، اختر الخدمة المناسبة، ثم أرسل تفاصيل طلبك وموقعك. ستتمكن من متابعة حالة الطلب من قسم طلباتي.",
  },
  {
    q: "كيف أسجل حساباً مهنياً؟",
    a: "اختر إنشاء حساب مهني، أدخل رقم الجوال، أكمل بياناتك وتخصصك وموقع عملك، ثم ارفع الصورة الشخصية والهوية للمراجعة والاعتماد.",
  },
  {
    q: "كم تستغرق مراجعة طلب اعتماد المهني؟",
    a: "عادةً تتم مراجعة الطلب خلال يوم إلى ثلاثة أيام عمل. ستصلك حالة الطلب داخل التطبيق وإشعار عند صدور القرار.",
  },
  {
    q: "هل يمكنني تعديل بياناتي بعد التسجيل؟",
    a: "نعم، افتح حسابي ثم اضغط أيقونة التعديل بجانب اسمك، حدّث البيانات المطلوبة واضغط حفظ التعديلات.",
  },
  {
    q: "كيف أغير الوضع الليلي أو النهاري؟",
    a: "من الإعدادات افتح قسم المظهر واختر تلقائي أو نهاري أو ليلي، وسيتم حفظ اختيارك على جهازك.",
  },
  {
    q: "ماذا أفعل إذا تعذر رفع المستندات؟",
    a: "تأكد من اتصال الإنترنت وأن الصور واضحة، ثم أعد المحاولة. إذا استمرت المشكلة تواصل مع الدعم وأرفق وصفاً للخطأ.",
  },
];

export default function HelpSupport() {
  const [, navigate] = useLocation();
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="premium-surface min-h-[100dvh] bg-background" dir="rtl">
      <AppPage width="mobile" className="pt-safe">
        <PageHeading
          eyebrow="مركز فزعة"
          title="المساعدة والدعم"
          description="نحن هنا لمساعدتك في فزعة، سواء كنت تبحث عن إجابة أو تحتاج إلى تواصل مباشر."
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
          <div className="flex items-start gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-accent text-primary">
              <HelpCircle className="h-6 w-6" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-lg font-black">كيف يمكننا مساعدتك؟</h2>
              <p className="mt-1 text-sm leading-6 text-primary-foreground/75">
                إجابات سريعة لأكثر الأسئلة شيوعاً، وخيارات مباشرة للتواصل مع
                فريق فزعة.
              </p>
            </div>
          </div>
        </SurfaceCard>

        <section className="mb-7">
          <SectionHeading
            title="الأسئلة الشائعة"
            description="اختر السؤال لعرض الإجابة بالتفصيل."
            className="px-1"
          />
          <SurfaceCard
            as="section"
            className="overflow-hidden divide-y divide-border/70"
          >
            {faqs.map((faq, index) => {
              const isOpen = open === index;
              const answerId = `faq-answer-${index}`;
              return (
                <div key={faq.q}>
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : index)}
                    aria-expanded={isOpen}
                    aria-controls={answerId}
                    className="flex min-h-[68px] w-full items-center justify-between gap-3 px-4 py-4 text-right transition-colors hover:bg-primary/[0.04] sm:px-5"
                  >
                    <span className="text-sm font-extrabold leading-6 text-foreground">
                      {faq.q}
                    </span>
                    <ChevronDown
                      className={`h-5 w-5 shrink-0 text-primary transition-transform ${isOpen ? "rotate-180" : ""}`}
                      aria-hidden="true"
                    />
                  </button>
                  {isOpen && (
                    <p
                      id={answerId}
                      className="border-t border-border/70 px-4 pb-5 pt-3 text-sm leading-7 text-muted-foreground sm:px-5"
                    >
                      {faq.a}
                    </p>
                  )}
                </div>
              );
            })}
          </SurfaceCard>
        </section>

        <section className="mb-7">
          <SectionHeading
            title="تواصل مع الدعم الفني"
            description="اختر القناة المناسبة وسنكون سعداء بمساعدتك."
            className="px-1"
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <a
              href="https://wa.me/967000000000"
              target="_blank"
              rel="noreferrer"
              className="flex min-h-[82px] items-center gap-3 rounded-3xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800 transition hover:bg-emerald-100 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/70">
                <MessageCircle className="h-5 w-5" aria-hidden="true" />
              </span>
              <span>
                <b className="block text-sm font-extrabold">واتساب الدعم</b>
                <small className="mt-1 block text-xs leading-5 opacity-75">
                  رد سريع خلال أوقات العمل
                </small>
              </span>
            </a>
            <a
              href="mailto:support@fazaah.app"
              className="flex min-h-[82px] items-center gap-3 rounded-3xl border border-blue-200 bg-blue-50 p-4 text-blue-800 transition hover:bg-blue-100 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-300"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/70">
                <Mail className="h-5 w-5" aria-hidden="true" />
              </span>
              <span>
                <b className="block text-sm font-extrabold">
                  البريد الإلكتروني
                </b>
                <small className="mt-1 block text-xs leading-5 opacity-75">
                  support@fazaah.app
                </small>
              </span>
            </a>
          </div>
        </section>
        <div className="flex items-center justify-center gap-2 pb-4 text-xs text-muted-foreground">
          <ShieldCheck className="h-4 w-4 text-primary" aria-hidden="true" />{" "}
          دعم آمن وخصوصية بياناتك أولوية لدينا
        </div>
      </AppPage>
    </div>
  );
}
