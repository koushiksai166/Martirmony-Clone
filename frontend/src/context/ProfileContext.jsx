import { createContext, useState } from "react";

export const ProfileContext = createContext();

function ProfileProvider({ children }) {
  const [profileData, setProfileData] = useState({
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