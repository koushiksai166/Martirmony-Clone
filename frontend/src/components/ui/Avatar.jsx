import { useState } from "react";

// API Base URL for resolving relative backend upload paths
const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5001";

/**
 * Resolves relative uploaded image URLs (/uploads/...) to fully-qualified backend URLs
 * @param {string|null} src - Image URL or relative path
 * @returns {string|null} Full image URL
 */
function resolveUrl(src) {
  if (!src) return null;
  if (src.startsWith("/uploads/")) return `${API_URL}${src}`;
  return src;
}

/**
 * Avatar Component
 *
 * Renders a circular user avatar:
 * - Displays user photo if valid URL is provided.
 * - Automatically falls back to name initials if image fails to load or is not provided.
 *
 * @param {object} props
 * @param {string|null} [props.src] - Image source URL or relative path
 * @param {string} [props.name="Member"] - Name of the user used for initials fallback
 * @param {"sm"|"md"|"lg"} [props.size="md"] - Size dimension variant
 */
function Avatar({ src, name = "Member", size = "md" }) {
  // Extract up to 2 uppercase initials from the user's name
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  // Size styling tokens
  const dimensions =
    size === "lg"
      ? "h-24 w-24 text-2xl"
      : size === "sm"
      ? "h-9 w-9 text-xs"
      : "h-12 w-12 text-sm";

  // Track if image loading failed to trigger fallback
  const [broken, setBroken] = useState(false);
  const resolved = resolveUrl(src);

  // If a valid image URL is available and hasn't errored out, render <img>
  if (resolved && !broken) {
    return (
      <img
        src={resolved}
        alt={`${name} profile`}
        className={`${dimensions} rounded-full object-cover`}
        loading="lazy"
        onError={() => setBroken(true)}
      />
    );
  }

  // Fallback: Circular container with user initials
  return (
    <div
      aria-label={`${name} avatar`}
      className={`${dimensions} flex items-center justify-center rounded-full bg-[var(--rose-soft)] font-bold text-[var(--rose)]`}
    >
      {initials}
    </div>
  );
}

export default Avatar;

