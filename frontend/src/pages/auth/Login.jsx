import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, ArrowRight } from "lucide-react";
import { toast } from "react-toastify";
import AuthLayout from "../../layouts/AuthLayout";
import Button from "../../components/common/Button";
import { login } from "../../services/auth.service";
import { useAuth } from "../../hooks/useAuth";
import { getProfile } from "../../services/profile.service";

function Login() {
  const navigate = useNavigate(); const { login: loginUser } = useAuth();
  const [formData, setFormData] = useState({ email: "", password: "" }); const [loading, setLoading] = useState(false); const [showPassword, setShowPassword] = useState(false);
  const submit = async (event) => { event.preventDefault(); if (!formData.email || !formData.password) { toast.error("Enter your email and password"); return; } try { setLoading(true); const response = await login(formData); await loginUser(response.data.access_token); try { const profile = await getProfile(); navigate(profile.data.profile?.isProfileComplete ? "/dashboard" : "/profile/edit", { replace: true }); } catch (error) { navigate(error.response?.status === 404 ? "/profile/create" : "/dashboard", { replace: true }); } } catch (error) { toast.error(error.response?.data?.message || "We could not sign you in"); } finally { setLoading(false); } };
  return <AuthLayout eyebrow="Welcome back"><div className="mb-9 lg:hidden"><p className="display-font text-2xl font-bold">Matrimony</p></div><p className="eyebrow">Sign in</p><h2 className="display-font mt-3 text-4xl leading-tight">Good to see you again.</h2><p className="mt-3 text-[var(--ink-soft)]">Continue where you left off.</p><form onSubmit={submit} className="mt-8 space-y-5"><label className="block"><span className="field-label">Email address</span><input className="field-input mt-2" type="email" autoComplete="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="you@example.com" /></label><label className="block"><span className="field-label">Password</span><span className="relative mt-2 block"><input className="field-input pr-12" type={showPassword ? "text" : "password"} autoComplete="current-password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} placeholder="Your password" /><button type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)]">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></span></label><div className="flex justify-end"><button type="button" className="text-sm font-bold text-[var(--rose)]">Forgot password?</button></div><Button type="submit" disabled={loading} className="w-full">{loading ? "Signing in..." : <>Sign in <ArrowRight size={17} /></>}</Button></form><p className="mt-8 text-center text-sm text-[var(--ink-soft)]">New here? <Link className="font-bold text-[var(--rose)]" to="/register">Create an account</Link></p></AuthLayout>;
}

export default Login;
