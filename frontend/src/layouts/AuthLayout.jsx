import { HeartHandshake, ShieldCheck, Sparkles } from "lucide-react";

function AuthLayout({ children, eyebrow = "A more meaningful way to meet" }) {
  return (
    <div className="app-page grid min-h-screen lg:grid-cols-[.9fr_1.1fr]">
      <aside className="relative hidden overflow-hidden bg-[var(--ink)] px-12 py-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-28 -top-28 h-80 w-80 rounded-full border border-white/10" /><div className="absolute -bottom-32 -left-24 h-96 w-96 rounded-full border border-[var(--gold)]/25" />
        <div className="relative"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--rose)] font-bold">M</div><span className="display-font text-2xl font-bold">Matrimony</span></div><p className="eyebrow mt-24 text-[#d9ad71]">{eyebrow}</p><h1 className="display-font mt-4 max-w-lg text-5xl leading-tight">Find a partnership that feels like home.</h1><p className="mt-6 max-w-md text-base leading-7 text-white/65">A considered space for people who value intention, family, and the little things that make a life together.</p></div>
        <div className="relative grid gap-4 sm:grid-cols-3"><div><HeartHandshake size={20} className="text-[#d9ad71]" /><p className="mt-2 text-sm text-white/70">Values first</p></div><div><ShieldCheck size={20} className="text-[#d9ad71]" /><p className="mt-2 text-sm text-white/70">Privacy minded</p></div><div><Sparkles size={20} className="text-[#d9ad71]" /><p className="mt-2 text-sm text-white/70">Made for clarity</p></div></div>
      </aside>
      <main className="flex items-center justify-center px-5 py-10 sm:px-8"><div className="w-full max-w-md">{children}</div></main>
    </div>
  );
}

export default AuthLayout;
