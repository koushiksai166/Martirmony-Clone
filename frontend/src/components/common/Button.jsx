function Button({ children, variant = "primary", className = "", ...props }) {
	const styles = variant === "secondary" ? "btn-secondary" : variant === "quiet" ? "btn-quiet" : "btn-primary";
	return <button className={`${styles} ${className}`} {...props}>{children}</button>;
}

export default Button;
