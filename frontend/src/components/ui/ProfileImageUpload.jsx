import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { Camera, Trash2 } from "lucide-react";
import Avatar from "../ui/Avatar";
import { uploadProfilePicture, deleteProfilePicture } from "../../services/profile.service";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024;
const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5001";

function resolveUrl(src) {
  if (!src) return null;
  if (src.startsWith("/uploads/")) return `${API_URL}${src}`;
  return src;
}

function ProfileImageUpload({ currentUrl, name = "Member", onUploaded, onDeleted }) {
  const inputRef = useRef(null);
  const [preview, setPreview] = useState(resolveUrl(currentUrl) ?? null);
  const [uploading, setUploading] = useState(false);

  // Sync preview when parent passes a new currentUrl (e.g. after refreshProfile)
  useEffect(() => {
    setPreview(resolveUrl(currentUrl) ?? null);
  }, [currentUrl]);

  const handleFile = async (file) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("Only JPEG, PNG, and WebP images are allowed");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("Image must be 5 MB or smaller");
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    setUploading(true);

    try {
      const { data } = await uploadProfilePicture(file);
      toast.success("Profile picture updated");
      onUploaded?.(data.profilePicture);
    } catch (err) {
      setPreview(resolveUrl(currentUrl) ?? null);
      toast.error(err.response?.data?.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  };

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
      <div className="relative">
        <Avatar src={preview} name={name} size="lg" />
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
          </div>
        )}
      </div>

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
