function Location({
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
      "country",
      "state",
      "city",
    ]);

    if (valid) {
      nextStep();
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-8">
        Location
      </h2>

      <div className="grid grid-cols-2 gap-6">

        {/* Country */}
        <div>
          <label className="block mb-2">
            Country
          </label>

          <input
            {...register("country", {
              required: "Country is required",
            })}
            className="w-full border rounded-lg p-3"
            placeholder="India"
          />

          <p className="text-red-500 text-sm mt-1">
            {errors.country?.message}
          </p>
        </div>

        {/* State */}
        <div>
          <label className="block mb-2">
            State
          </label>

          <input
            {...register("state", {
              required: "State is required",
            })}
            className="w-full border rounded-lg p-3"
            placeholder="Telangana"
          />

          <p className="text-red-500 text-sm mt-1">
            {errors.state?.message}
          </p>
        </div>

        {/* City */}
        <div>
          <label className="block mb-2">
            City
          </label>

          <input
            {...register("city", {
              required: "City is required",
            })}
            className="w-full border rounded-lg p-3"
            placeholder="Hyderabad"
          />

          <p className="text-red-500 text-sm mt-1">
            {errors.city?.message}
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

export default Location;