function Card({ children, className = "", ...props }) {
	return <section className={`app-surface ${className}`} {...props}>{children}</section>;
}

export default Card;
