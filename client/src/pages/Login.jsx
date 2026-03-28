import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

export default function Login() {
    const { login } = useAuth();
    const [emailOrPhone, setEmailOrPhone] = useState("");
    const [password, setPassword] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from?.pathname || "/account";

    async function onSubmit(e) {
        e.preventDefault();
        setSubmitting(true);

        try {
            await login(emailOrPhone, password);
            toast.success("Logged in successfully");
            navigate(from, { replace: true });
        } catch (err) {
            toast.error(err?.message || err?.response?.data?.message || "Login failed");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-surface-white-subtle px-4">
            <div className="w-full max-w-md bg-white p-6 md:p-8 rounded-2xl shadow">
                <button
                    type="button"
                    onClick={() => navigate("/")}
                    className="
    mb-4 inline-flex items-center gap-2
    rounded-full px-3 py-1.5
    text-sm font-medium text-text-muted
    hover:bg-surface-white-subtle hover:text-text-primary
    transition
  "
                >
                    <span className="text-lg leading-none">←</span>
                    <span>Back to Home</span>
                </button>


                <h1 className="text-3xl font-bold mb-2 text-[var(--brand-dark)]">
                    Login
                </h1>
                <p className="text-text-muted mb-6">
                    Login to submit and track your requests.
                </p>

                <form onSubmit={onSubmit} className="space-y-4">
                    <input
                        className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--brand-dark)]"
                        placeholder="Email or Phone"
                        value={emailOrPhone}
                        onChange={(e) => setEmailOrPhone(e.target.value)}
                        required
                    />

                    <div className="relative">
                        <input
                            type={showPassword ? "text" : "password"}
                            className="w-full p-3 border rounded-lg pr-12 focus:outline-none focus:ring-2 focus:ring-[var(--brand-dark)]"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />

                        <button
                            type="button"
                            onClick={() => setShowPassword((prev) => !prev)}
                            className="absolute inset-y-0 right-3 flex items-center text-text-muted hover:text-text-primary"
                            aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                            {showPassword ? (
                                /* Eye Off */
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-5 w-5"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-1.38.279-2.695.785-3.875M6.343 6.343A9.956 9.956 0 0112 5c5.523 0 10 4.477 10 10a9.953 9.953 0 01-4.222 8.13M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                    />
                                </svg>
                            ) : (
                                /* Eye */
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-5 w-5"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                    />
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                    />
                                </svg>
                            )}
                        </button>
                    </div>

                    <div className="flex items-center justify-center">
                        <Link
                            to="/forgot-password"
                            className="text-sm text-primary-blue-active hover:underline"
                        >
                            Forgot password?
                        </Link>
                    </div>


                    {/* ✅ Missing Submit Button */}
                    <button
                        disabled={submitting}
                        className="w-full bg-primary-blue-active text-white py-3 rounded-lg font-semibold hover:opacity-90 disabled:opacity-60"
                        type="submit"
                    >
                        {submitting ? "Logging in..." : "Login"}
                    </button>
                </form>

                <div className="mt-6 text-sm text-center">
                    Don&apos;t have an account?{" "}
                    <Link to="/register" className="text-[var(--brand-dark)] font-semibold">
                        Register
                    </Link>
                </div>
            </div>
        </div>
    );
}
