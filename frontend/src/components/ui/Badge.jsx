function Badge({ children, tone = "neutral" }) {
	const tones = { success: "bg-[#e5f2ed] text-[var(--success)]", danger: "bg-[#fae8e8] text-[var(--danger)]", rose: "bg-[var(--rose-soft)] text-[var(--rose)]", neutral: "bg-[#f1efec] text-[var(--ink-soft)]" };
	return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ${tones[tone] || tones.neutral}`}>{children}</span>;
}

export default Badge;
