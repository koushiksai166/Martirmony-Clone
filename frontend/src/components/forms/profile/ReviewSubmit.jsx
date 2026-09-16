import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { createProfile } from "../../../services/profile.service";
import { useAuth } from "../../../hooks/useAuth";

function ReviewSubmit({ methods, previousStep }) {
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();

  const values = methods.getValues();

  const handleSubmit = async () => {
    try {
      await createProfile(values);
      await refreshProfile();

      toast.success("Profile created successfully!");

      navigate("/dashboard", { replace: true });
    } catch (error) {
      console.error("Profile creation error:", error);

      toast.error(
        error.response?.data?.message ||
          "Failed to create profile"
      );
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6">
        Review & Submit
      </h2>

      {/* Profile Summary */}
      <div className="bg-gray-50 rounded-xl p-6 space-y-4">

        <div>
          <strong>First Name:</strong>{" "}
          {values.firstName}
        </div>

        <div>
          <strong>Last Name:</strong>{" "}
          {values.lastName}
        </div>

        <div>
          <strong>Gender:</strong>{" "}
          {values.gender}
        </div>

        <div>
          <strong>Date of Birth:</strong>{" "}
          {values.dateOfBirth}
        </div>

        <div>
          <strong>Height:</strong>{" "}
          {values.height}
        </div>

        <div>
          <strong>Religion:</strong>{" "}
          {values.religion}
        </div>

        <div>
          <strong>Caste:</strong>{" "}
          {values.caste}
        </div>

        <div>
          <strong>Mother Tongue:</strong>{" "}
          {values.motherTongue}
        </div>

        <div>
          <strong>Education:</strong>{" "}
          {values.education}
        </div>

        <div>
          <strong>Occupation:</strong>{" "}
          {values.occupation}
        </div>

        <div>
          <strong>Annual Income:</strong>{" "}
          {values.annualIncome}
        </div>

        <div>
          <strong>Country:</strong>{" "}
          {values.country}
        </div>

        <div>
          <strong>State:</strong>{" "}
          {values.state}
        </div>

        <div>
          <strong>City:</strong>{" "}
          {values.city}
        </div>

        <div>
          <strong>About Me:</strong>

          <p className="mt-1 text-gray-600">
            {values.aboutMe}
          </p>
        </div>

      </div>

      {/* Buttons */}
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