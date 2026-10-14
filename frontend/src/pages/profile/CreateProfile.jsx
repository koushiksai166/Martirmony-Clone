import { useState } from "react";
import { useForm } from "react-hook-form";

import BasicInfo from "../../components/forms/profile/BasicInfo";
import EducationCareer from "../../components/forms/profile/EducationCareer";
import Location from "../../components/forms/profile/Location";
import AboutMe from "../../components/forms/profile/AboutMe";
import ReviewSubmit from "../../components/forms/profile/ReviewSubmit";

import Stepper from "../../components/ui/Stepper";

// Step title identifiers for progress stepper
const steps = ["Basic", "Career", "Location", "About", "Review"];

/**
 * CreateProfile Page Component
 *
 * Multi-step onboarding wizard for newly registered members to set up their matrimonial profile:
 * - Step 1: Basic Information (Name, Gender, DOB, Height, Weight, Photo).
 * - Step 2: Education & Career (Highest Qualification, Occupation, Annual Income).
 * - Step 3: Location (Country, State, City).
 * - Step 4: About Me (Religion, Caste, Mother Tongue, Bio).
 * - Step 5: Review & Submit (Summary preview and final API submission).
 */
function CreateProfile() {
  // Current active step (1 to 5)
  const [step, setStep] = useState(1);

  // Central react-hook-form state shared across all steps
  const methods = useForm({
    defaultValues: {
      // Pre-fill names if cached during registration
      firstName: localStorage.getItem("reg_firstName") ?? "",
      lastName: localStorage.getItem("reg_lastName") ?? "",
      gender: "",
      dateOfBirth: "",
      height: "",
      weight: "",

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

  // Wizard navigation helpers
  const nextStep = () => setStep((prev) => prev + 1);
  const previousStep = () => setStep((prev) => prev - 1);

  return (
    <div className="min-h-screen bg-slate-100 py-10">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-8">
        {/* Step Progress Bar */}
        <Stepper currentStep={step} steps={steps} />

        {/* Step 1: Basic Information */}
        {step === 1 && <BasicInfo methods={methods} nextStep={nextStep} />}

        {/* Step 2: Education & Career */}
        {step === 2 && (
          <EducationCareer
            methods={methods}
            nextStep={nextStep}
            previousStep={previousStep}
          />
        )}

        {/* Step 3: Geographic Location */}
        {step === 3 && (
          <Location
            methods={methods}
            nextStep={nextStep}
            previousStep={previousStep}
          />
        )}

        {/* Step 4: Cultural Background & Bio */}
        {step === 4 && (
          <AboutMe
            methods={methods}
            nextStep={nextStep}
            previousStep={previousStep}
          />
        )}

        {/* Step 5: Review & Final Submission */}
        {step === 5 && (
          <ReviewSubmit methods={methods} previousStep={previousStep} />
        )}
      </div>
    </div>
  );
}

export default CreateProfile;