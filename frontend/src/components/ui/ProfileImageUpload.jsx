import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { Camera, Trash2 } from "lucide-react";
import Avatar from "../ui/Avatar";
import {
  uploadProfilePicture,
  deleteProfilePicture,
} from "../../services/profile.service";

// Accepted image file MIME types
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

// Maximum permitted file size: 5 Megabytes
const MAX_BYTES = 5 * 1024 * 1024;

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
 * ProfileImageUpload Component
 *
 * Interactive photo uploader and avatar management widget:
 * - Allows selecting an image file (JPEG/PNG/WebP under 5MB).
 * - Generates instant local preview before/during upload.
 * - Uploads the file to backend `/upload/profile-picture` endpoint.
 * - Allows removing the existing profile photo.
 *
 * @param {object} props
 * @param {string} [props.currentUrl] - Existing profile picture URL if set
 * @param {string} [props.name="Member"] - Member's name for avatar fallback
 * @param {Function} [props.onUploaded] - Callback invoked with new image URL upon successful upload
 * @param {Function} [props.onDeleted] - Callback invoked after successful image deletion
 */
function ProfileImageUpload({
  currentUrl,
  name = "Member",
  onUploaded,
  onDeleted,
}) {
  // Hidden file input reference
  const inputRef = useRef(null);

  // Local image preview state
  const [preview, setPreview] = useState(resolveUrl(currentUrl) ?? null);

  // Upload/deletion in-progress indicator
  const [uploading, setUploading] = useState(false);

  // Sync preview when parent updates currentUrl (e.g. after profile refresh)
  useEffect(() => {
    setPreview(resolveUrl(currentUrl) ?? null);
  }, [currentUrl]);

  /**
   * Validates selected image file and uploads to the server
   * @param {File} file - Selected image file from input
   */
  const handleFile = async (file) => {
    // Validate MIME type
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("Only JPEG, PNG, and WebP images are allowed");
      return;
    }

    // Validate size limit (5MB)
    if (file.size > MAX_BYTES) {
      toast.error("Image must be 5 MB or smaller");
      return;
    }

    // Generate immediate temporary local preview
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    setUploading(true);

    try {
      // Upload image via multipart FormData API
      const { data } = await uploadProfilePicture(file);
      toast.success("Profile picture updated");
      onUploaded?.(data.profilePicture);
    } catch (err) {
      // Reset preview on failure
      setPreview(resolveUrl(currentUrl) ?? null);
      toast.error(err.response?.data?.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  /**
   * Handles deletion of current profile photo
   */
  const handleDelete = async () => {
    if (!window.confirm("Remove your profile picture?")) return;
    setUploading(true);
    try {
      await deleteProfilePicture();
      setPreview(null);
      toast.success("Profile picture removed");
      onDeleted?.();
    } catch (err) {
      toast.error(err.response?.data?.message ?? "Delete failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Avatar Container with Spinner Overlay during uploads */}
      <div className="relative">
        <Avatar src={preview} name={name} size="lg" />
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
          </div>
        )}
      </div>

      {/* Control Buttons (Change / Upload / Remove) */}
      <div className="flex gap-2">
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
        >
          <Camera size={15} />
          {preview ? "Change" : "Upload photo"}
        </button>

        {preview && (
          <button
            type="button"
            disabled={uploading}
            onClick={handleDelete}
            className="flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            <Trash2 size={15} />
            Remove
          </button>
        )}
      </div>

      {/* Hidden Native File Input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}

export default ProfileImageUpload;

