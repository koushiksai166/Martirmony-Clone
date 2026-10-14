import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  createProfile,
  uploadProfilePicture,
} from "../../../services/profile.service";
import { useAuth } from "../../../hooks/useAuth";

/**
 * ReviewSubmit Form Step Component
 *
 * Final step (Step 5) in the profile creation wizard:
 * - Summarizes all user-entered information for final review.
 * - Displays preview of the chosen profile avatar if present.
 * - On submission:
 *   1. Calls `createProfile` API with all form fields.
 *   2. If a photo was selected, uploads the image via `uploadProfilePicture`.
 *   3. Calls `refreshProfile` to update the global auth context with the new profile.
 *   4. Cleans up temporary registration items from `localStorage`.
 *   5. Redirects the user to the `/dashboard`.
 *
 * @param {object} props
 * @param {object} props.methods - react-hook-form instance methods
 * @param {Function} props.previousStep - Transition function back to step 4 (Location)
 */
function ReviewSubmit({ methods, previousStep }) {
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();
  const values = methods.getValues();

  /**
   * Submits the completed profile and optional photo to the backend
   */
  const handleSubmit = async () => {
    try {
      // 1. Create the base matrimonial profile
      await createProfile({
        firstName: values.firstName,
        lastName: values.lastName,
        gender: values.gender,
        dateOfBirth: values.dateOfBirth,
        height: values.height,
        weight: values.weight,
        religion: values.religion,
        caste: values.caste,
        motherTongue: values.motherTongue,
        education: values.education,
        occupation: values.occupation,
        annualIncome: values.annualIncome,
        city: values.city,
        state: values.state,
        country: values.country,
        aboutMe: values.aboutMe,
      });

      // 2. Upload avatar photo if one was chosen in Step 1
      if (values._pictureFile) {
        try {
          await uploadProfilePicture(values._pictureFile);
        } catch {
          toast.warn(
            "Profile created but photo upload failed — you can upload it from Edit Profile."
          );
        }
      }

      // 3. Sync profile into global React state
      await refreshProfile();

      // 4. Remove temporary registration caches
      localStorage.removeItem("reg_firstName");
      localStorage.removeItem("reg_lastName");

      toast.success("Profile created successfully!");

      // 5. Navigate to authenticated home dashboard
      navigate("/dashboard", { replace: true });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create profile");
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6">Review & Submit</h2>

      {/* Profile summary card */}
      <div className="bg-gray-50 rounded-xl p-6 space-y-4 text-sm">
        {values._pictureFile && (
          <div className="flex justify-center mb-4">
            <img
              src={URL.createObjectURL(values._pictureFile)}
              alt="Profile preview"
              className="h-24 w-24 rounded-full object-cover border-2 border-pink-200"
            />
          </div>
        )}
        <div>
          <strong>First Name:</strong> {values.firstName}
        </div>
        <div>
          <strong>Last Name:</strong> {values.lastName}
        </div>
        <div>
          <strong>Gender:</strong> {values.gender}
        </div>
        <div>
          <strong>Date of Birth:</strong> {values.dateOfBirth}
        </div>
        <div>
          <strong>Height:</strong> {values.height} cm
        </div>
        <div>
          <strong>Weight:</strong> {values.weight} kg
        </div>
        <div>
          <strong>Religion:</strong> {values.religion}
        </div>
        <div>
          <strong>Caste:</strong> {values.caste}
        </div>
        <div>
          <strong>Mother Tongue:</strong> {values.motherTongue}
        </div>
        <div>
          <strong>Education:</strong> {values.education}
        </div>
        <div>
          <strong>Occupation:</strong> {values.occupation}
        </div>
        <div>
          <strong>Annual Income:</strong> {values.annualIncome} LPA
        </div>
        <div>
          <strong>Country:</strong> {values.country}
        </div>
        <div>
          <strong>State:</strong> {values.state}
        </div>
        <div>
          <strong>City:</strong> {values.city}
        </div>
        <div>
          <strong>About Me:</strong>
          <p className="mt-1 text-gray-600 leading-relaxed">{values.aboutMe}</p>
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="flex justify-between mt-10">
        <button
          type="button"
          onClick={previousStep}
          className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2.5 rounded-lg font-medium transition"
        >
          Previous
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-lg font-medium transition"
        >
          Submit
        </button>
      </div>
    </div>
  );
}

export default ReviewSubmit;