import { createContext, useState } from "react";

/**
 * ProfileContext
 * 
 * Context used to manage profile registration wizard state across multiple steps/forms.
 * Allows multi-step profile builder pages to read and incrementally populate profile data
 * before final submission.
 */
// eslint-disable-next-line react-refresh/only-export-components
export const ProfileContext = createContext();

/**
 * ProfileProvider Component
 * 
 * Wraps profile creation/edit wizard components to hold temporary profile form state.
 * Contains fields for personal details, religious background, education/career, location, and photos.
 */
function ProfileProvider({ children }) {
  // Global profile creation/editing form state
  const [profileData, setProfileData] = useState({
    // Basic personal details
    firstName: "",
    lastName: "",
    gender: "",
    dateOfBirth: "",
    height: "",

    // Cultural & religious background
    religion: "",
    caste: "",
    motherTongue: "",

    // Professional & financial details
    education: "",
    occupation: "",
    annualIncome: "",

    // Location & residency
    city: "",
    state: "",
    country: "",

    // Bio & profile visual
    aboutMe: "",
    profilePicture: "",
  });

  return (
    <ProfileContext.Provider
      value={{
        profileData,
        setProfileData,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export default ProfileProvider;