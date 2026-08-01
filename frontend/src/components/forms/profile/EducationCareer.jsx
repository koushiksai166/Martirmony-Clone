function EducationCareer({
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
      "education",
      "occupation",
      "annualIncome",
    ]);

    if (valid) {
      nextStep();
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-8">
        Education & Career
      </h2>

      <div className="grid grid-cols-2 gap-6">

        {/* Education */}
        <div>
          <label className="block mb-2">
            Education
          </label>

          <input
            {...register("education", {
              required: "Education is required",
            })}
            className="w-full border rounded-lg p-3"
            placeholder="B.Tech"
          />

          <p className="text-red-500 text-sm mt-1">
            {errors.education?.message}
          </p>
        </div>

        {/* Occupation */}
        <div>
          <label className="block mb-2">
            Occupation
          </label>

          <input
            {...register("occupation", {
              required: "Occupation is required",
            })}
            className="w-full border rounded-lg p-3"
            placeholder="Software Engineer"
          />

          <p className="text-red-500 text-sm mt-1">
            {errors.occupation?.message}
          </p>
        </div>

        {/* Annual Income */}
        <div>
          <label className="block mb-2">
            Annual Income (LPA)
          </label>

          <input
            type="number"
            {...register("annualIncome", {
              required: "Annual income is required",
              valueAsNumber: true,
            })}
            className="w-full border rounded-lg p-3"
            placeholder="12"
          />

          <p className="text-red-500 text-sm mt-1">
            {errors.annualIncome?.message}
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

export default EducationCareer;