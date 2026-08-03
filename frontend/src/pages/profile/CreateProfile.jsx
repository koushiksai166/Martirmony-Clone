import { useState } from "react";
import { useForm } from "react-hook-form";

import BasicInfo from "../../components/forms/profile/BasicInfo";
import EducationCareer from "../../components/forms/profile/EducationCareer";
import Location from "../../components/forms/profile/Location";
import AboutMe from "../../components/forms/profile/AboutMe";
import ReviewSubmit from "../../components/forms/profile/ReviewSubmit";

import Stepper from "../../components/ui/Stepper";

const steps = ["Basic", "Career", "Location", "About", "Review"];

function CreateProfile() {
  const [step, setStep] = useState(1);

  const methods = useForm({
    defaultValues: {
      firstName: "",
      lastName: "",
      gender: "",
      dateOfBirth: "",
      height: "",

      religion: "",
      caste: "",
      motherTongue: "",

      education: "",
      occupation: "",
      annualIncome: "",

      city: "",
      state: "",
      country: "",

      aboutMe: "",
      profilePicture: "",
    },
  });

  const nextStep = () => setStep((prev) => prev + 1);

  const previousStep = () => setStep((prev) => prev - 1);

  return (
    <div className="min-h-screen bg-slate-100 py-10">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-8">
        <Stepper
          currentStep={step}
          steps={steps}
        />

        {step === 1 && (
          <BasicInfo
            methods={methods}
            nextStep={nextStep}
          />
        )}

        {step === 2 && (
          <EducationCareer
            methods={methods}
            nextStep={nextStep}
            previousStep={previousStep}
          />
        )}

        {step === 3 && (
          <Location
            methods={methods}
            nextStep={nextStep}
            previousStep={previousStep}
          />
        )}

        {step === 4 && (
          <AboutMe
            methods={methods}
            nextStep={nextStep}
            previousStep={previousStep}
          />
        )}

        {step === 5 && (
          <ReviewSubmit
            methods={methods}
            previousStep={previousStep}
          />
        )}
      </div>
    </div>
  );
}

export default CreateProfile;