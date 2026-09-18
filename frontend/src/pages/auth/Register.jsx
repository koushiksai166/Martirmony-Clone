import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, ArrowRight } from "lucide-react";
import { toast } from "react-toastify";
import AuthLayout from "../../layouts/AuthLayout";
import Button from "../../components/common/Button";
import { register } from "../../services/auth.service";

function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    profileFor: "Myself",
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const submit = async (event) => {
    event.preventDefault();
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
      toast.error("Complete the required fields");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    try {
      setLoading(true);
      await register({ email: formData.email, password: formData.password });
      localStorage.setItem("reg_firstName", formData.firstName);
      localStorage.setItem("reg_lastName", formData.lastName);
      toast.success("Your account is ready");
      navigate("/login");
    } catch (error) {
      toast.error(error.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };
  return (
    <AuthLayout eyebrow="Begin with intention">
      <div className="mb-9 lg:hidden">
        <p className="display-font text-2xl font-bold">Saanjh</p>
      </div>
      <p className="eyebrow">Create your account</p>
      <h2 className="display-font mt-3 text-4xl leading-tight">
        A thoughtful first step.
      </h2>
      <p className="mt-3 text-[var(--ink-soft)]">
        Tell us a little about who you are creating this profile for.
      </p>
      <form onSubmit={submit} className="mt-8 space-y-5">
        <label className="block">
          <span className="field-label">Profile created for</span>
          <select
            className="field-input mt-2"
            value={formData.profileFor}
            onChange={(e) =>
              setFormData({ ...formData, profileFor: e.target.value })
            }
          >
            <option>Myself</option>
            <option>Daughter</option>
            <option>Son</option>
            <option>Sibling</option>
            <option>Relative</option>
          </select>
        </label>
        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="field-label">First name</span>
            <input
              className="field-input mt-2"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              placeholder="First name"
            />
          </label>
          <label className="block">
            <span className="field-label">Last name</span>
            <input
              className="field-input mt-2"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              placeholder="Last name"
            />
          </label>
        </div>
        <label className="block">
          <span className="field-label">Email address</span>
          <input
            className="field-input mt-2"
            type="email"
            autoComplete="email"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            placeholder="you@example.com"
          />
        </label>
        <label className="block">
          <span className="field-label">Password</span>
          <span className="relative mt-2 block">
            <input
              className="field-input pr-12"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              placeholder="At least 8 characters"
            />
            <button
              type="button"
              aria-label={showPassword ? "Hide password" : "Show password"}
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)]"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </span>
        </label>
        <label className="block">
          <span className="field-label">Confirm password</span>
          <span className="relative mt-2 block">
            <input
              className="field-input pr-12"
              type={showConfirmPassword ? "text" : "password"}
              autoComplete="new-password"
              value={formData.confirmPassword}
              onChange={(e) =>
                setFormData({ ...formData, confirmPassword: e.target.value })
              }
              placeholder="Repeat your password"
            />
            <button
              type="button"
              aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)]"
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </span>
          {formData.confirmPassword && (
            <p className={`mt-2 text-sm ${formData.password === formData.confirmPassword ? "text-green-600" : "text-red-500"}`}>
              {formData.password === formData.confirmPassword ? "Passwords match" : "Passwords do not match"}
            </p>
          )}
        </label>
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? (
            "Creating account..."
          ) : (
            <>
              Create account <ArrowRight size={17} />
            </>
          )}
        </Button>
        <p className="text-xs leading-5 text-[var(--muted)]">
          By continuing, you agree to our terms and privacy policy.
        </p>
      </form>
      <p className="mt-8 text-center text-sm text-[var(--ink-soft)]">
        Already registered?{" "}
        <Link className="font-bold text-[var(--rose)]" to="/login">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}

export default Register;