import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  BriefcaseBusiness,
  ChevronLeft,
  ChevronsRight,
  FileCheck2,
  LayoutDashboard,
  LogOut,
  Menu,
  PanelRightClose,
  PanelRightOpen,
  ShieldCheck,
  Tags,
  UsersRound,
  X,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { BrandLogo } from "@/components/brand-logo";

const navigation = [
  { href: "/control-center", label: "نظرة عامة", icon: LayoutDashboard },
  { href: "/control-center/users", label: "المستخدمون", icon: UsersRound },
  { href: "/control-center/providers", label: "اعتماد المهنيين", icon: ShieldCheck },
  { href: "/control-center/business", label: "الاشتراكات والإعلانات", icon: BriefcaseBusiness },
  { href: "/control-center/complaints", label: "الشكاوى والنزاعات", icon: FileCheck2 },
  { href: "/control-center/taxonomy", label: "التخصصات والخدمات", icon: Tags },
];
const APP_URL = (import.meta.env.VITE_APP_URL || "https://fazaaweb-gbk3efhf.manus.space").replace(/\/$/, "");

export function ControlCenterLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();
  const active = navigation.find(item => item.href === location) ?? navigation[0];

  const sidebar = (
    <aside className={`flex h-full flex-col border-l border-white/10 bg-[#102443] text-white shadow-2xl transition-all duration-200 ${collapsed ? "w-[84px]" : "w-[276px]"}`}>
      <div className="flex h-20 items-center justify-between border-b border-white/10 px-5">
        {!collapsed && <div className="min-w-0"><BrandLogo className="h-10 w-24 object-contain brightness-0 invert" /><p className="mt-1 text-[10px] text-white/50">مركز إدارة منصة فزعة</p></div>}
        {collapsed && <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-2xl bg-[#f0b046] text-xl font-black text-[#102443]">ف</span>}
        <button type="button" onClick={() => setCollapsed(value => !value)} className="hidden rounded-xl p-2 text-white/60 transition hover:bg-white/10 hover:text-white lg:block" aria-label={collapsed ? "توسيع القائمة" : "طي القائمة"}>
          {collapsed ? <PanelRightOpen className="h-5 w-5" /> : <PanelRightClose className="h-5 w-5" />}
        </button>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {!collapsed && <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">الإدارة</p>}
        {navigation.map(item => {
          const isActive = item.href === location;
          return <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)} className={`flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-bold transition ${isActive ? "bg-[#f0b046] text-[#102443] shadow-lg shadow-[#f0b046]/10" : "text-white/65 hover:bg-white/10 hover:text-white"}`} title={collapsed ? item.label : undefined}><item.icon className="h-5 w-5 shrink-0" /><span className={collapsed ? "sr-only" : ""}>{item.label}</span>{isActive && !collapsed && <ChevronLeft className="mr-auto h-4 w-4" />}</Link>;
        })}
      </nav>
      <div className="border-t border-white/10 p-4">
        {!collapsed && <div className="mb-3 rounded-2xl bg-white/5 p-3"><p className="truncate text-sm font-bold">{user?.name || "مدير المنصة"}</p><p className="mt-1 truncate text-[11px] text-white/45">صلاحية مدير النظام</p></div>}
        <button type="button" onClick={logout} className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm font-bold text-white/60 transition hover:bg-red-400/10 hover:text-red-200 ${collapsed ? "justify-center" : ""}`}><LogOut className="h-5 w-5" /><span className={collapsed ? "sr-only" : ""}>تسجيل الخروج</span></button>
      </div>
    </aside>
  );

  return <div className="min-h-[100dvh] bg-[#f5f7fb] text-[#162b4d]" dir="rtl"><div className="flex min-h-[100dvh]">{mobileOpen && <button type="button" aria-label="إغلاق القائمة" onClick={() => setMobileOpen(false)} className="fixed inset-0 z-40 bg-[#07172d]/60 lg:hidden" />}{<div className={`fixed inset-y-0 right-0 z-50 transform lg:static lg:z-auto lg:transform-none ${mobileOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"}`}>{sidebar}</div>}<div className="min-w-0 flex-1"><header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-[#e5eaf2] bg-white/90 px-4 backdrop-blur md:px-8"><div className="flex items-center gap-3"><button type="button" onClick={() => setMobileOpen(true)} className="rounded-xl p-2 text-[#53647d] hover:bg-[#eef2f8] lg:hidden" aria-label="فتح القائمة"><Menu className="h-5 w-5" /></button><div><p className="text-xs font-bold text-[#8a98aa]">مركز الإدارة / {active.label}</p><h1 className="mt-1 text-xl font-black">{active.label}</h1></div></div><div className="flex items-center gap-2"><a href={APP_URL} className="hidden items-center gap-2 rounded-xl border border-[#e5eaf2] px-3 py-2 text-xs font-bold text-[#53647d] transition hover:border-[#102443] hover:text-[#102443] md:flex"><ChevronsRight className="h-4 w-4" />العودة للتطبيق</a><div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#eaf0f8] text-sm font-black text-[#102443]">{user?.name?.charAt(0) || "م"}</div><button type="button" onClick={logout} className="rounded-xl p-2 text-[#8a98aa] hover:bg-red-50 hover:text-red-600 md:hidden" aria-label="تسجيل الخروج"><X className="h-5 w-5" /></button></div></header><main className="mx-auto w-full max-w-[1500px] p-4 md:p-8">{children}</main></div></div></div>;
}
