function Avatar({ src, name = "Member", size = "md" }) {
	const initials = name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
	const dimensions = size === "lg" ? "h-24 w-24 text-2xl" : size === "sm" ? "h-9 w-9 text-xs" : "h-12 w-12 text-sm";
	return src ? <img src={src} alt={`${name} profile`} className={`${dimensions} rounded-full object-cover`} loading="lazy" /> : <div aria-label={`${name} avatar`} className={`${dimensions} flex items-center justify-center rounded-full bg-[var(--rose-soft)] font-bold text-[var(--rose)]`}>{initials}</div>;
}

export default Avatar;
