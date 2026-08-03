function BasicInfo({ methods, nextStep }) {
  const {
    register,
    trigger,
    formState: { errors },
  } = methods;

  const handleNext = async () => {
    const valid = await trigger([
      "firstName",
      "lastName",
      "gender",
      "dateOfBirth",
      "height",
    ]);

    if (valid) {
      nextStep();
    }
  };

  return (
    <div>

      <h2 className="text-2xl font-bold mb-8">
        Basic Information
      </h2>

      <div className="grid grid-cols-2 gap-6">

        {/* First Name */}
        <div>
          <label className="block mb-2">First Name</label>

          <input
            {...register("firstName", {
              required: "First name is required",
            })}
            className="w-full border rounded-lg p-3"
          />

          <p className="text-red-500 text-sm mt-1">
            {errors.firstName?.message}
          </p>
        </div>

        {/* Last Name */}
        <div>
          <label className="block mb-2">Last Name</label>

          <input
            {...register("lastName", {
              required: "Last name is required",
            })}
            className="w-full border rounded-lg p-3"
          />

          <p className="text-red-500 text-sm mt-1">
            {errors.lastName?.message}
          </p>
        </div>

        {/* Gender */}
        <div>
          <label className="block mb-2">Gender</label>

          <select
            {...register("gender", {
              required: "Gender is required",
            })}
            className="w-full border rounded-lg p-3"
          >
            <option value="">Select Gender</option>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
          </select>

          <p className="text-red-500 text-sm mt-1">
            {errors.gender?.message}
          </p>
        </div>

        {/* DOB */}
        <div>
          <label className="block mb-2">
            Date of Birth
          </label>

          <input
            type="date"
            {...register("dateOfBirth", {
              required: "Date of birth is required",
            })}
            className="w-full border rounded-lg p-3"
          />

          <p className="text-red-500 text-sm mt-1">
            {errors.dateOfBirth?.message}
          </p>
        </div>

        {/* Height */}
        <div>
          <label className="block mb-2">
            Height (cm)
          </label>

          <input
            type="number"
            {...register("height", {
              required: "Height is required",
            })}
            className="w-full border rounded-lg p-3"
          />

          <p className="text-red-500 text-sm mt-1">
            {errors.height?.message}
          </p>
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