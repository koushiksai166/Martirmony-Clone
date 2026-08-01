import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { login } from "../../services/auth.service";
import { toast } from "react-toastify";
import { useAuth } from "../../hooks/useAuth";
import { getProfile } from "../../services/profile.service";

function Login() {
  const navigate = useNavigate();
  const { login: loginUser } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      const response = await login(formData);

      await loginUser(response.data.access_token);

      try {
        await getProfile();
        navigate("/dashboard", { replace: true });
      } catch (error) {
        if (error.response?.status === 404) {
          navigate("/profile/create", { replace: true });
        } else {
          toast.error("Unable to load profile");
        }
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Login Failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">

        <h1 className="text-3xl font-bold text-center mb-8">
          Login
        </h1>

        <form onSubmit={handleSubmit} className="space-y-5">

          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            className="w-full border rounded-lg p-3"
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            className="w-full border rounded-lg p-3"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-pink-600 text-white p-3 rounded-lg hover:bg-pink-700"
          >
            {loading ? "Logging in..." : "Login"}
          </button>

        </form>

        <p className="text-center mt-6">
          Don't have an account?{" "}
          <Link
            className="text-pink-600 font-semibold"
            to="/register"
          >
            Register
          </Link>
        </p>

      </div>
    </div>
  );
}

export default Login;