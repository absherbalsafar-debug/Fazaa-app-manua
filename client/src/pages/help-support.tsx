import { useState } from "react";
import { useLocation } from "wouter";
import { ArrowRight, ChevronDown, HelpCircle, MessageCircle, Mail, ShieldCheck } from "lucide-react";

const faqs = [
  { q: "كيف أطلب خدمة من مهني؟", a: "افتح الرئيسية أو اكتشف المهنيين، اختر الخدمة المناسبة، ثم أرسل تفاصيل طلبك وموقعك. ستتمكن من متابعة حالة الطلب من قسم طلباتي." },
  { q: "كيف أسجل حساباً مهنياً؟", a: "اختر إنشاء حساب مهني، أدخل رقم الجوال، أكمل بياناتك وتخصصك وموقع عملك، ثم ارفع الصورة الشخصية والهوية للمراجعة والاعتماد." },
  { q: "كم تستغرق مراجعة طلب اعتماد المهني؟", a: "عادةً تتم مراجعة الطلب خلال يوم إلى ثلاثة أيام عمل. ستصلك حالة الطلب داخل التطبيق وإشعار عند صدور القرار." },
  { q: "هل يمكنني تعديل بياناتي بعد التسجيل؟", a: "نعم، افتح حسابي ثم اضغط أيقونة التعديل بجانب اسمك، حدّث البيانات المطلوبة واضغط حفظ التعديلات." },
  { q: "كيف أغير الوضع الليلي أو النهاري؟", a: "من الإعدادات افتح قسم المظهر واختر تلقائي أو نهاري أو ليلي، وسيتم حفظ اختيارك على جهازك." },
  { q: "ماذا أفعل إذا تعذر رفع المستندات؟", a: "تأكد من اتصال الإنترنت وأن الصور واضحة، ثم أعد المحاولة. إذا استمرت المشكلة تواصل مع الدعم وأرفق وصفاً للخطأ." },
];

export default function HelpSupport() {
  const [, navigate] = useLocation();
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="min-h-[100dvh] bg-background pb-10" dir="rtl">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-primary/10 bg-background/85 px-4 py-4 backdrop-blur-xl">
        <button type="button" onClick={() => navigate('/settings')} className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card" aria-label="رجوع"><ArrowRight className="h-4 w-4" /></button>
        <div><h1 className="text-base font-black text-foreground">المساعدة والدعم</h1><p className="text-[10px] text-muted-foreground">نحن هنا لمساعدتك في فزعة</p></div>
      </header>

      <main className="mx-auto max-w-lg space-y-5 px-4 pt-5">
        <section className="rounded-[28px] bg-primary p-5 text-primary-foreground shadow-lg">
          <div className="flex items-start gap-3"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-accent text-primary"><HelpCircle className="h-6 w-6" /></div><div><h2 className="text-lg font-black">كيف يمكننا مساعدتك؟</h2><p className="mt-1 text-sm leading-6 text-primary-foreground/75">إجابات سريعة لأكثر الأسئلة شيوعاً، وخيارات مباشرة للتواصل مع فريق فزعة.</p></div></div>
        </section>

        <section className="space-y-2"><h2 className="px-1 text-sm font-black text-foreground">الأسئلة الشائعة</h2>{faqs.map((faq, index) => { const isOpen = open === index; return <div key={faq.q} className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"><button type="button" onClick={() => setOpen(isOpen ? null : index)} className="flex w-full items-center justify-between gap-3 px-4 py-4 text-right"><span className="text-sm font-bold text-foreground">{faq.q}</span><ChevronDown className={`h-4 w-4 shrink-0 text-primary transition-transform ${isOpen ? "rotate-180" : ""}`} /></button>{isOpen && <p className="border-t border-border/70 px-4 pb-4 pt-3 text-sm leading-7 text-muted-foreground">{faq.a}</p>}</div>; })}</section>

        <section className="space-y-2"><h2 className="px-1 text-sm font-black text-foreground">تواصل مع الدعم الفني</h2><div className="grid gap-3 sm:grid-cols-2"><a href="https://wa.me/967000000000" target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800 transition hover:bg-emerald-100 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300"><MessageCircle className="h-5 w-5" /><span><b className="block text-sm">واتساب الدعم</b><small className="text-xs opacity-75">رد سريع خلال أوقات العمل</small></span></a><a href="mailto:support@fazaah.app" className="flex items-center gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-blue-800 transition hover:bg-blue-100 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-300"><Mail className="h-5 w-5" /><span><b className="block text-sm">البريد الإلكتروني</b><small className="text-xs opacity-75">support@fazaah.app</small></span></a></div></section>
        <div className="flex items-center justify-center gap-2 py-2 text-xs text-muted-foreground"><ShieldCheck className="h-4 w-4 text-primary" /> دعم آمن وخصوصية بياناتك أولوية لدينا</div>
      </main>
    </div>
  );
}
