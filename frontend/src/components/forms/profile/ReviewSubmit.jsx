import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { createProfile, uploadProfilePicture } from "../../../services/profile.service";
import { useAuth } from "../../../hooks/useAuth";

function ReviewSubmit({ methods, previousStep }) {
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();
  const values = methods.getValues();

  const handleSubmit = async () => {
    try {
      await createProfile({
        firstName: values.firstName,
        lastName: values.lastName,
        gender: values.gender,
        dateOfBirth: values.dateOfBirth,
        height: values.height,
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

      if (values._pictureFile) {
        try {
          await uploadProfilePicture(values._pictureFile);
        } catch {
          toast.warn("Profile created but photo upload failed — you can upload it from Edit Profile.");
        }
      }

      await refreshProfile();
      localStorage.removeItem("reg_firstName");
      localStorage.removeItem("reg_lastName");
      toast.success("Profile created successfully!");
      navigate("/dashboard", { replace: true });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create profile");
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6">Review & Submit</h2>

      <div className="bg-gray-50 rounded-xl p-6 space-y-4">
        {values._pictureFile && (
          <div className="flex justify-center mb-4">
            <img
              src={URL.createObjectURL(values._pictureFile)}
              alt="Profile preview"
              className="h-24 w-24 rounded-full object-cover border-2 border-pink-200"
            />
          </div>
        )}
        <div><strong>First Name:</strong> {values.firstName}</div>
        <div><strong>Last Name:</strong> {values.lastName}</div>
        <div><strong>Gender:</strong> {values.gender}</div>
        <div><strong>Date of Birth:</strong> {values.dateOfBirth}</div>
        <div><strong>Height:</strong> {values.height}</div>
        <div><strong>Religion:</strong> {values.religion}</div>
        <div><strong>Caste:</strong> {values.caste}</div>
        <div><strong>Mother Tongue:</strong> {values.motherTongue}</div>
        <div><strong>Education:</strong> {values.education}</div>
        <div><strong>Occupation:</strong> {values.occupation}</div>
        <div><strong>Annual Income:</strong> {values.annualIncome}</div>
        <div><strong>Country:</strong> {values.country}</div>
        <div><strong>State:</strong> {values.state}</div>
        <div><strong>City:</strong> {values.city}</div>
        <div><strong>About Me:</strong><p className="mt-1 text-gray-600">{values.aboutMe}</p></div>
      </div>

      <div className="flex justify-between mt-10">
        <button
          type="button"
          onClick={previousStep}
          className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg"
        >
          Previous
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg"
        >
          Submit
        </button>

      </div>
    </div>
  );
}

export default ReviewSubmit;
