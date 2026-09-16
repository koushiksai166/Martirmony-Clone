import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import DashboardLayout from "../../layouts/DashboardLayout";
import { useAuth } from "../../hooks/useAuth";
import { updateProfile } from "../../services/profile.service";
import ProfileImageUpload from "../../components/ui/ProfileImageUpload";

function EditProfile() {
  const navigate = useNavigate();
  const { profile, refreshProfile } = useAuth();
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    if (profile) {
      reset({
        ...profile,
        dateOfBirth: profile.dateOfBirth?.slice(0, 10),
      });
    }
  }, [profile, reset]);

  const onSubmit = async (values) => {
    setSaving(true);
    try {
      const editableFields = [
        "firstName",
        "lastName",
        "gender",
        "dateOfBirth",
        "height",
        "religion",
        "caste",
        "motherTongue",
        "education",
        "occupation",
        "annualIncome",
        "city",
        "state",
        "country",
        "aboutMe",
      ];
      const payload = Object.fromEntries(
        editableFields
          .map((field) => [field, values[field]])
          .filter(([, value]) => value !== undefined && value !== null && value !== "" && !Number.isNaN(value)),
      );

      await updateProfile(payload);
      await refreshProfile();
      toast.success("Profile updated successfully");
      navigate("/profile");
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to update profile");
    } finally {
      setSaving(false);
    }
  };

  const input = (name, label, options = {}) => (
    <label className="block" key={name}>
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input
        {...register(name, options)}
        type={name === "dateOfBirth" ? "date" : name === "height" || name === "annualIncome" ? "number" : "text"}
        className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5"
      />
      {errors[name] && <span className="mt-1 block text-sm text-red-600">{errors[name].message}</span>}
    </label>
  );

  return (
    <DashboardLayout>
      <form onSubmit={handleSubmit(onSubmit)} className="mx-auto max-w-4xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Edit profile</h1>
          <p className="mt-2 text-slate-600">Keep your details current so your profile represents you well.</p>
        </div>
        <section className="flex justify-center rounded-xl bg-white p-6 shadow-sm">
          <ProfileImageUpload
            currentUrl={profile?.profilePicture}
            name={profile ? `${profile.firstName} ${profile.lastName}` : "Member"}
            onUploaded={async () => { await refreshProfile(); }}
            onDeleted={async () => { await refreshProfile(); }}
          />
        </section>
        <section className="grid gap-5 rounded-xl bg-white p-6 shadow-sm sm:grid-cols-2">
          {input("firstName", "First name", { required: "First name is required" })}
          {input("lastName", "Last name", { required: "Last name is required" })}
          {input("dateOfBirth", "Date of birth", { required: "Date of birth is required" })}
          {input("height", "Height (cm)", { required: "Height is required", valueAsNumber: true })}
          {input("religion", "Religion")}
          {input("caste", "Caste")}
          {input("motherTongue", "Mother tongue")}
          {input("education", "Education")}
          {input("occupation", "Occupation")}
          {input("annualIncome", "Annual income", { valueAsNumber: true })}
          {input("country", "Country")}
          {input("state", "State")}
          {input("city", "City")}
          <label className="block sm:col-span-2">
            <span className="text-sm font-medium text-slate-700">About me</span>
            <textarea {...register("aboutMe")} rows={5} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5" />
          </label>
        </section>
        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => navigate("/profile")} className="rounded-lg border border-slate-300 px-5 py-3">Cancel</button>
          <button disabled={saving} type="submit" className="rounded-lg bg-pink-600 px-5 py-3 font-medium text-white disabled:opacity-60">
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </form>
    </DashboardLayout>
  );
}

export default EditProfile;
