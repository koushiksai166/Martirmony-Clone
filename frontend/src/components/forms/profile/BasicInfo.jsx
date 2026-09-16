import { useRef, useState } from "react";
import { toast } from "react-toastify";
import { Camera } from "lucide-react";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024;

function BasicInfo({ methods, nextStep }) {
  const {
    register,
    trigger,
    setValue,
    watch,
    formState: { errors },
  } = methods;

  const inputRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const pictureFile = watch("_pictureFile");

  const handleFile = (file) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("Only JPEG, PNG, and WebP images are allowed");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("Image must be 5 MB or smaller");
      return;
    }
    setPreview(URL.createObjectURL(file));
    setValue("_pictureFile", file);
  };

  const handleNext = async () => {
    const valid = await trigger(["firstName", "lastName", "gender", "dateOfBirth", "height"]);
    if (valid) nextStep();
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-8">Basic Information</h2>

      {/* Profile picture picker */}
      <div className="mb-8 flex flex-col items-center gap-3">
        <div
          className="h-24 w-24 cursor-pointer rounded-full border-2 border-dashed border-slate-300 overflow-hidden flex items-center justify-center bg-slate-50 hover:border-pink-400 transition"
          onClick={() => inputRef.current?.click()}
        >
          {preview
            ? <img src={preview} alt="Preview" className="h-full w-full object-cover" />
            : <Camera size={28} className="text-slate-400" />}
        </div>
        <button type="button" onClick={() => inputRef.current?.click()} className="text-sm text-pink-600 hover:underline">
          {pictureFile ? "Change photo" : "Upload profile photo (optional)"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
        />
      </div>

      <div className="grid grid-cols-2 gap-6">

        {/* First Name */}
        <div>
          <label className="block mb-2">First Name</label>
          <input
            {...register("firstName", { required: "First name is required" })}
            className="w-full border rounded-lg p-3"
          />
          <p className="text-red-500 text-sm mt-1">{errors.firstName?.message}</p>
        </div>

        {/* Last Name */}
        <div>
          <label className="block mb-2">Last Name</label>
          <input
            {...register("lastName", { required: "Last name is required" })}
            className="w-full border rounded-lg p-3"
          />
          <p className="text-red-500 text-sm mt-1">{errors.lastName?.message}</p>
        </div>

        {/* Gender */}
        <div>
          <label className="block mb-2">Gender</label>
          <select
            {...register("gender", { required: "Gender is required" })}
            className="w-full border rounded-lg p-3"
          >
            <option value="">Select Gender</option>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
          </select>
          <p className="text-red-500 text-sm mt-1">{errors.gender?.message}</p>
        </div>

        {/* DOB */}
        <div>
          <label className="block mb-2">Date of Birth</label>
          <input
            type="date"
            {...register("dateOfBirth", { required: "Date of birth is required" })}
            className="w-full border rounded-lg p-3"
          />
          <p className="text-red-500 text-sm mt-1">{errors.dateOfBirth?.message}</p>
        </div>

        {/* Height */}
        <div>
          <label className="block mb-2">Height (cm)</label>
          <input
            type="number"
            {...register("height", { required: "Height is required", valueAsNumber: true })}
            className="w-full border rounded-lg p-3"
          />
          <p className="text-red-500 text-sm mt-1">{errors.height?.message}</p>
        </div>

      </div>

      <div className="flex justify-end mt-10">
        <button
          onClick={handleNext}
          className="bg-pink-600 hover:bg-pink-700 text-white px-8 py-3 rounded-lg"
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default BasicInfo;
