function Input({ label, error, id, className = "", ...props }) {
	return (
		<label className="block" htmlFor={id}>
			{label && <span className="field-label">{label}</span>}
			<input id={id} className={`field-input mt-2 ${className}`} {...props} />
			{error && <span className="mt-1 block text-sm text-[var(--danger)]">{error}</span>}
		</label>
	);
}

export default Input;
