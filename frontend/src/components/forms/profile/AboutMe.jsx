function AboutMe({
  methods,
  nextStep,
  previousStep,
}) {
  const {
    register,
    trigger,
    formState: { errors },
  } = methods;

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
      <h2 className="text-2xl font-bold mb-8">
        About Me
      </h2>

      <div className="grid grid-cols-2 gap-6">

        {/* Religion */}
        <div>
          <label className="block mb-2">
            Religion
          </label>

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
          <label className="block mb-2">
            Caste
          </label>

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
          <label className="block mb-2">
            Mother Tongue
          </label>

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

        {/* About Me */}
        <div className="col-span-2">
          <label className="block mb-2">
            About Me
          </label>

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
            placeholder="Tell us about yourself..."
          />

          <p className="text-red-500 text-sm mt-1">
            {errors.aboutMe?.message}
          </p>
        </div>

      </div>

      <div className="flex justify-between mt-10">

        <button
          type="button"
          onClick={previousStep}
          className="bg-gray-500 hover:bg-gray-600 text-white px-8 py-3 rounded-lg"
        >
          Previous
        </button>

        <button
          type="button"
          onClick={handleNext}
          className="bg-pink-600 hover:bg-pink-700 text-white px-8 py-3 rounded-lg"
        >
          Next
        </button>

      </div>
    </div>
  );
}

export default AboutMe;