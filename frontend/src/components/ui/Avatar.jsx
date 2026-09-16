import { useState } from "react";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5001";

// Resolve relative /uploads/... paths to absolute API URLs
function resolveUrl(src) {
  if (!src) return null;
  if (src.startsWith("/uploads/")) return `${API_URL}${src}`;
  return src;
}

function Avatar({ src, name = "Member", size = "md" }) {
	const initials = name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
	const dimensions = size === "lg" ? "h-24 w-24 text-2xl" : size === "sm" ? "h-9 w-9 text-xs" : "h-12 w-12 text-sm";
	const [broken, setBroken] = useState(false);
	const resolved = resolveUrl(src);
	if (resolved && !broken) {
		return <img src={resolved} alt={`${name} profile`} className={`${dimensions} rounded-full object-cover`} loading="lazy" onError={() => setBroken(true)} />;
	}
	return <div aria-label={`${name} avatar`} className={`${dimensions} flex items-center justify-center rounded-full bg-[var(--rose-soft)] font-bold text-[var(--rose)]`}>{initials}</div>;
}

export default Avatar;
