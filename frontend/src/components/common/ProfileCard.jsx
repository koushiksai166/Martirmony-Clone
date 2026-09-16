import { ArrowRight, Heart, MapPin, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import Avatar from "../ui/Avatar";
import Badge from "../ui/Badge";
import Button from "./Button";

function ProfileCard({ profile, compatibility, onInterest, interestLoading = false }) {
  const name = `${profile.firstName} ${profile.lastName}`;
  return <article className="app-surface overflow-hidden p-5 transition hover:-translate-y-1 hover:shadow-xl"><div className="flex items-start gap-4"><Avatar src={profile.profilePicture} name={name} size="lg" /><div className="min-w-0 pt-1"><div className="flex flex-wrap items-center gap-2"><h3 className="truncate text-lg font-bold">{name}</h3>{profile.isVerified && <ShieldCheck size={17} className="text-[var(--success)]" aria-label="Verified profile" />}</div><p className="mt-1 flex items-center gap-1 text-sm text-[var(--ink-soft)]"><MapPin size={14} />{profile.city || profile.state || "Location private"}</p>{compatibility !== undefined && <Badge tone="rose">{compatibility}% compatible</Badge>}</div></div><div className="mt-5 grid grid-cols-2 gap-3 border-y border-[var(--line)] py-4 text-sm"><div><p className="text-xs text-[var(--muted)]">Education</p><p className="mt-1 truncate font-semibold">{profile.education || "Not shared"}</p></div><div><p className="text-xs text-[var(--muted)]">Occupation</p><p className="mt-1 truncate font-semibold">{profile.occupation || "Not shared"}</p></div></div><div className="mt-4 flex gap-2"><Link to={`/profile/${profile.id}`} className="btn-secondary flex-1 text-sm">View profile <ArrowRight size={15} /></Link>{onInterest && <Button onClick={() => onInterest(profile.id)} disabled={interestLoading} className="px-3" aria-label={`Send interest to ${name}`}><Heart size={17} /></Button>}</div></article>;
}

export default ProfileCard;
