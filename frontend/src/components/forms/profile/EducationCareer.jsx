/**
 * EducationCareer Form Step Component
 *
 * Step 2 in the profile creation wizard:
 * - Collects highest educational degree/qualification.
 * - Collects profession / job title.
 * - Collects annual income in LPA (INR).
 * - Validates input fields using react-hook-form before proceeding to Step 3.
 *
 * @param {object} props
 * @param {object} props.methods - react-hook-form instance methods
 * @param {Function} props.nextStep - Transition function to step 3
 * @param {Function} props.previousStep - Transition function back to step 1
 */
function EducationCareer({ methods, nextStep, previousStep }) {
  const {
    register,
    trigger,
    formState: { errors },
  } = methods;

  /**
   * Validates education and career fields before moving forward
   */
  const handleNext = async () => {
    const valid = await trigger(["education", "occupation", "annualIncome"]);

    if (valid) {
      nextStep();
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-8">Education & Career</h2>

      <div className="grid grid-cols-2 gap-6">
        {/* Highest Education */}
        <div>
          <label className="block mb-2 font-medium">Education</label>
          <input
            {...register("education", {
              required: "Education is required",
            })}
            className="w-full border rounded-lg p-3"
            placeholder="e.g. B.Tech / MBA / MS"
          />
          <p className="text-red-500 text-sm mt-1">
            {errors.education?.message}
          </p>
        </div>

        {/* Occupation / Profession */}
        <div>
          <label className="block mb-2 font-medium">Occupation</label>
          <input
            {...register("occupation", {
              required: "Occupation is required",
            })}
            className="w-full border rounded-lg p-3"
            placeholder="e.g. Software Engineer / Doctor"
          />
          <p className="text-red-500 text-sm mt-1">
            {errors.occupation?.message}
          </p>
        </div>

        {/* Annual Income (INR Lakhs) */}
        <div className="col-span-2">
          <label className="block mb-2 font-medium">Annual Income (LPA INR)</label>
          <input
            type="number"
            {...register("annualIncome", {
              required: "Annual income is required",
              valueAsNumber: true,
            })}
            className="w-full border rounded-lg p-3"
            placeholder="e.g. 15"
          />
          <p className="text-red-500 text-sm mt-1">
            {errors.annualIncome?.message}
          </p>
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="flex justify-between mt-10">
        <button
          type="button"
          onClick={previousStep}
          className="bg-gray-500 hover:bg-gray-600 text-white px-8 py-3 rounded-lg font-medium transition"
        >
          Previous
        </button>

        <button
          type="button"
          onClick={handleNext}
          className="bg-pink-600 hover:bg-pink-700 text-white px-8 py-3 rounded-lg font-medium transition"
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default EducationCareer;