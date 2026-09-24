/**
 * AboutMe Form Step Component
 *
 * Step 3 in the profile creation wizard:
 * - Collects cultural & religious identity (Religion, Caste, Mother Tongue).
 * - Collects personal biography (minimum 30 characters).
 * - Validates required fields using react-hook-form `trigger` before proceeding.
 *
 * @param {object} props
 * @param {object} props.methods - react-hook-form instance methods
 * @param {Function} props.nextStep - Transition function to step 4
 * @param {Function} props.previousStep - Transition function back to step 2
 */
function AboutMe({ methods, nextStep, previousStep }) {
  const {
    register,
    trigger,
    formState: { errors },
  } = methods;

  /**
   * Validates current step fields before navigating to the next step
   */
  const handleNext = async () => {
    const valid = await trigger([
      "religion",
      "caste",
      "motherTongue",
      "aboutMe",
    ]);

    if (valid) {
      nextStep();
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-8">About Me</h2>

      <div className="grid grid-cols-2 gap-6">
        {/* Religion */}
        <div>
          <label className="block mb-2 font-medium">Religion</label>
          <input
            {...register("religion", {
              required: "Religion is required",
            })}
            className="w-full border rounded-lg p-3"
            placeholder="Hindu"
          />
          <p className="text-red-500 text-sm mt-1">
            {errors.religion?.message}
          </p>
        </div>

        {/* Caste */}
        <div>
          <label className="block mb-2 font-medium">Caste</label>
          <input
            {...register("caste", {
              required: "Caste is required",
            })}
            className="w-full border rounded-lg p-3"
            placeholder="Kamma"
          />
          <p className="text-red-500 text-sm mt-1">
            {errors.caste?.message}
          </p>
        </div>

        {/* Mother Tongue */}
        <div className="col-span-2">
          <label className="block mb-2 font-medium">Mother Tongue</label>
          <input
            {...register("motherTongue", {
              required: "Mother tongue is required",
            })}
            className="w-full border rounded-lg p-3"
            placeholder="Telugu"
          />
          <p className="text-red-500 text-sm mt-1">
            {errors.motherTongue?.message}
          </p>
        </div>

        {/* About Me / Bio */}
        <div className="col-span-2">
          <label className="block mb-2 font-medium">About Me</label>
          <textarea
            rows={6}
            {...register("aboutMe", {
              required: "About me is required",
              minLength: {
                value: 30,
                message: "Write at least 30 characters",
              },
            })}
            className="w-full border rounded-lg p-3 resize-none"
            placeholder="Tell us about yourself, your values, interests, and what you seek in a life partner..."
          />
          <p className="text-red-500 text-sm mt-1">
            {errors.aboutMe?.message}
          </p>
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

export default AboutMe;