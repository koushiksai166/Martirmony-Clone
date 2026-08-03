function ReviewSubmit({ previousStep }) {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6">
        Review & Submit
      </h2>

      <div className="flex gap-4">
        <button
          onClick={previousStep}
          className="bg-gray-500 text-white px-6 py-2 rounded-lg"
        >
          Previous
        </button>

        <button
          type="submit"
          className="bg-green-600 text-white px-6 py-2 rounded-lg"
        >
          Submit
        </button>
      </div>
    </div>
  );
}

export default ReviewSubmit;