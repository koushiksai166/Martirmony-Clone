import { Bell, Compass, Crown, Heart, Home, LogOut, MessageCircle, Search, Settings, ShieldCheck, UserRound } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import Avatar from "../components/ui/Avatar";

const links = [
  ["/dashboard", "Overview", Home], ["/search", "Discover", Search],
  ["/matches", "Matches", Compass], ["/interests", "Interests", Heart],
  ["/messages", "Messages", MessageCircle], ["/notifications", "Alerts", Bell],
  ["/profile", "My profile", UserRound], ["/preferences", "Preferences", Settings],
  ["/membership", "Premium", Crown],
];

function DashboardLayout({ children }) {
  const { user, profile, logout } = useAuth();
  const name = profile ? `${profile.firstName} ${profile.lastName}` : user?.email || "Member";
  return (
    <div className="app-page flex min-h-screen flex-col lg:flex-row">
      <aside className="hidden w-72 shrink-0 border-r border-[var(--line)] bg-[var(--surface)] px-5 py-6 lg:flex lg:flex-col">
        <div className="flex items-center gap-3 px-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--rose)] text-lg font-bold text-white">M</div><div><p className="display-font text-xl font-bold">Saanjh</p><p className="text-xs text-[var(--muted)]">Meaningful beginnings</p></div></div>
        <nav aria-label="Main navigation" className="mt-10 space-y-1">
          {links.map(([to, label, Icon]) => <NavLink key={to} to={to} className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${isActive ? "bg-[var(--rose-soft)] text-[var(--rose)]" : "text-[var(--ink-soft)] hover:bg-[var(--surface-warm)] hover:text-[var(--ink)]"}`}><Icon size={18} strokeWidth={1.8} />{label}</NavLink>)}
          {user?.role === "ADMIN" && <NavLink to="/admin" className={({ isActive }) => `mt-5 flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold ${isActive ? "bg-[var(--rose-soft)] text-[var(--rose)]" : "text-[var(--ink-soft)] hover:bg-[var(--surface-warm)]"}`}><ShieldCheck size={18} />Admin</NavLink>}
        </nav>
        <div className="mt-auto border-t border-[var(--line)] pt-5"><div className="flex items-center gap-3 px-2"><Avatar src={profile?.profilePicture} name={name} size="sm" /><div className="min-w-0"><p className="truncate text-sm font-bold">{name}</p><p className="truncate text-xs text-[var(--muted)]">{user?.email}</p></div></div><button type="button" onClick={logout} className="btn-quiet mt-4 w-full justify-start"><LogOut size={17} /> Sign out</button></div>
      </aside>
      <div className="min-w-0 flex-1">
        <header className="flex items-center justify-between border-b border-[var(--line)] bg-[rgba(251,250,248,.88)] px-5 py-4 backdrop-blur lg:px-10"><div><p className="eyebrow">Your private space</p><p className="mt-1 text-sm text-[var(--ink-soft)]">A thoughtful way to meet someone meaningful.</p></div><NavLink to="/notifications" aria-label="Open notifications" className="relative rounded-full p-2 text-[var(--ink-soft)] hover:bg-[var(--rose-soft)] hover:text-[var(--rose)]"><Bell size={20} /></NavLink></header>
        <main className="mx-auto w-full max-w-[1440px] px-5 py-7 pb-28 sm:px-8 lg:px-10 lg:py-10 lg:pb-12">{children}</main>
      </div>
      <nav aria-label="Mobile navigation" className="fixed bottom-0 left-0 right-0 z-20 grid grid-cols-5 border-t border-[var(--line)] bg-white/95 px-2 py-2 backdrop-blur lg:hidden">{links.slice(0, 5).map(([to, label, Icon]) => <NavLink key={to} to={to} className={({ isActive }) => `flex flex-col items-center gap-1 rounded-lg px-1 py-2 text-[10px] font-bold ${isActive ? "text-[var(--rose)]" : "text-[var(--muted)]"}`}><Icon size={19} />{label}</NavLink>)}</nav>
    </div>
  );
}

export default DashboardLayout;
