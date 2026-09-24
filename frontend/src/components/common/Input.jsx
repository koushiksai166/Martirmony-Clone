/**
 * Input Component
 *
 * Form text input component encapsulating standard label styling,
 * validation error messaging, and input field aesthetics.
 *
 * @param {object} props
 * @param {string} [props.label] - Optional field label text
 * @param {string} [props.error] - Validation error message to display in red
 * @param {string} [props.id] - HTML input ID for label association
 * @param {string} [props.className=""] - Additional custom CSS classes for the input
 */
function Input({ label, error, id, className = "", ...props }) {
  return (
    <label className="block" htmlFor={id}>
      {/* Field Label */}
      {label && <span className="field-label">{label}</span>}

      {/* HTML Input Element */}
      <input id={id} className={`field-input mt-2 ${className}`} {...props} />

      {/* Validation Error Message */}
      {error && (
        <span className="mt-1 block text-sm text-[var(--danger)]">{error}</span>
      )}
    </label>
  );
}

export default Input;

