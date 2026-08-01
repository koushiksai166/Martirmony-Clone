import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { register } from "../../services/auth.service";
import { toast } from "react-toastify";
import {
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
} from "lucide-react";

function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    profileFor: "",
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      setLoading(true);

      // Split fullName into firstName and lastName for backend compatibility if needed
      const nameParts = formData.fullName.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      await register({
        ...formData,
        firstName,
        lastName
      });

      toast.success("Registration Successful");

      navigate("/login");
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Registration Failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">

        <h1 className="text-3xl font-bold text-center mb-8">
          Create a Matrimony Profile<br />
          <span className="text-xl font-normal">Find your perfect match</span>
        </h1>

        <form onSubmit={handleSubmit} className="space-y-5">

          <select
               name="profileFor"
               value={formData.profileFor}
               onChange={handleChange}
               className="w-full border rounded-lg p-3 bg-white"
             >
              <option value="" disabled>Profile created for</option>
              <option value="Myself">Myself</option>
            <option value="Daughter">Daughter</option>
            <option value="Son">Son</option>
            <option value="Sister">Sister</option>
            <option value="Brother">Brother</option>
            <option value="Relative">Relative</option>
            <option value="Friend">Friend</option>
          </select>

          <input
            type="text"
            name="fullName"
            placeholder={formData.profileFor === "" ? "Full Name" : formData.profileFor === "Myself" ? "Full Name" : `${formData.profileFor}'s Full Name`}
            value={formData.fullName || ""}
            onChange={handleChange}
            className="w-full border rounded-lg p-3"
          />

          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            className="w-full border rounded-lg p-3"
          />

          <div class="relative">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              className="w-full border rounded-lg p-3"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 px-3 flex items-center"
            >
              {showPassword ? <EyeOff /> : <Eye />}
            </button>
          </div>

          <div class="relative">
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full border rounded-lg p-3"
            />
            {formData.confirmPassword && (
              <div className="absolute inset-y-0 right-0 px-3 flex items-center">
                {formData.password === formData.confirmPassword ? (
                  <CheckCircle className="text-green-500" />
                ) : (
                  <XCircle className="text-red-500" />
                )}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-pink-600 text-white p-3 rounded-lg hover:bg-pink-700"
          >
            {loading ? "Creating..." : "Register Free"}
          </button>
          <p className="text-xs text-center text-gray-500 mt-4">
            *By clicking register free, I agree to the T&C and Privacy Policy
          </p>
        </form>

        <p className="text-center mt-6">
          Already have an account?{" "}
          <Link
            className="text-pink-600 font-semibold"
            to="/login"
          >
            Login
          </Link>
        </p>

      </div>
    </div>
  );
}

export default Register;