/**
 * Card Component
 *
 * Reusable surface container that applies consistent background, border,
 * elevation shadow, and rounded corners according to the design system.
 *
 * @param {object} props
 * @param {React.ReactNode} props.children - Card content elements
 * @param {string} [props.className=""] - Additional CSS classes
 */
function Card({ children, className = "", ...props }) {
  return (
    <section className={`app-surface ${className}`} {...props}>
      {children}
    </section>
  );
}

export default Card;

