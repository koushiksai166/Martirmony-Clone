/**
 * Location Form Step Component
 *
 * Step 4 in the profile creation wizard:
 * - Collects geographic residency information (Country, State, City).
 * - Triggers validation check on location fields before moving to review step.
 *
 * @param {object} props
 * @param {object} props.methods - react-hook-form instance methods
 * @param {Function} props.nextStep - Transition function to step 5 (Review & Submit)
 * @param {Function} props.previousStep - Transition function back to step 3 (About Me)
 */
function Location({ methods, nextStep, previousStep }) {
  const {
    register,
    trigger,
    formState: { errors },
  } = methods;

  /**
   * Validates location fields before navigating to review step
   */
  const handleNext = async () => {
    const valid = await trigger(["country", "state", "city"]);

    if (valid) {
      nextStep();
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-8">Location</h2>

      <div className="grid grid-cols-2 gap-6">
        {/* Country */}
        <div>
          <label className="block mb-2 font-medium">Country</label>
          <input
            {...register("country", {
              required: "Country is required",
            })}
            className="w-full border rounded-lg p-3"
            placeholder="e.g. India"
          />
          <p className="text-red-500 text-sm mt-1">
            {errors.country?.message}
          </p>
        </div>

        {/* State */}
        <div>
          <label className="block mb-2 font-medium">State</label>
          <input
            {...register("state", {
              required: "State is required",
            })}
            className="w-full border rounded-lg p-3"
            placeholder="e.g. Telangana"
          />
          <p className="text-red-500 text-sm mt-1">
            {errors.state?.message}
          </p>
        </div>

        {/* City */}
        <div className="col-span-2">
          <label className="block mb-2 font-medium">City</label>
          <input
            {...register("city", {
              required: "City is required",
            })}
            className="w-full border rounded-lg p-3"
            placeholder="e.g. Hyderabad"
          />
          <p className="text-red-500 text-sm mt-1">{errors.city?.message}</p>
        </div>
      </div>

      {/* Step Navigation Controls */}
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

export default Location;