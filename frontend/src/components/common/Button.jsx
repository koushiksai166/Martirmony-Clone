/**
 * Button Component
 *
 * Reusable design system button supporting multiple visual variants:
 * - `primary`: High-emphasis rose gradient button for primary actions
 * - `secondary`: Medium-emphasis outlined/neutral button for secondary actions
 * - `quiet`: Low-emphasis ghost button for subtle interactions (e.g., logout, cancel)
 *
 * @param {object} props
 * @param {React.ReactNode} props.children - Button label or nested icon/content
 * @param {"primary"|"secondary"|"quiet"} [props.variant="primary"] - Visual style variant
 * @param {string} [props.className=""] - Additional custom CSS class names
 */
function Button({ children, variant = "primary", className = "", ...props }) {
  // Map variant name to corresponding CSS design token class
  const styles =
    variant === "secondary"
      ? "btn-secondary"
      : variant === "quiet"
      ? "btn-quiet"
      : "btn-primary";

  return (
    <button className={`${styles} ${className}`} {...props}>
      {children}
    </button>
  );
}

export default Button;

