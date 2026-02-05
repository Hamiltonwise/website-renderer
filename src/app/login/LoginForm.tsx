"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, ArrowRight, Loader2, CheckCircle, Shield } from "lucide-react";

type Step = "email" | "otp";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/otp/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to send OTP");
      }

      setStep("otp");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: otp }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Invalid code");
      }

      // Cookie is now set server-side, but also set client-side for redundancy
      // Use shared domain in production for cross-app auth sync
      const isProduction = window.location.hostname.includes('getalloro.com');
      const domain = isProduction ? '; domain=.getalloro.com' : '';
      document.cookie = `auth_token=${data.token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax${domain}`;

      // Store in localStorage for cross-tab sync
      localStorage.setItem("auth_token", data.token);

      // Broadcast login event for same-origin tabs
      try {
        const channel = new BroadcastChannel("auth_channel");
        channel.postMessage({ type: "login", token: data.token });
        channel.close();
      } catch (e) {
        // BroadcastChannel not supported, skip
      }

      // Small delay to ensure cookie is set before redirect
      await new Promise(resolve => setTimeout(resolve, 100));

      // Hard redirect to ensure middleware runs
      window.location.href = redirectTo;
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, type: "spring", stiffness: 100 }}
      >
        {/* Logo and Brand */}
        <motion.div
          className="mb-8 text-center"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <motion.img
            src="/alloro-logo.png"
            alt="Alloro Logo"
            className="mx-auto h-16 w-16 rounded-2xl shadow-lg mb-4"
            whileHover={{ scale: 1.05 }}
          />
          <h1 className="text-2xl font-bold text-gray-900">
            <span className="text-alloro-orange">Website Builder</span> Admin
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Sign in to access the control panel
          </p>
        </motion.div>

        {/* Error Message */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm text-center"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Card */}
        <motion.div
          className="rounded-2xl border border-gray-100 bg-white p-8 shadow-xl"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <AnimatePresence mode="wait">
            {step === "email" ? (
              <motion.form
                key="email-form"
                onSubmit={handleSendOtp}
                className="space-y-5"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="text-center mb-6">
                  <motion.div
                    className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-alloro-orange/20 to-alloro-orange/10"
                    animate={loading ? { scale: [1, 1.05, 1] } : {}}
                    transition={loading ? { duration: 1, repeat: Infinity } : {}}
                  >
                    <Lock className="h-7 w-7 text-alloro-orange" />
                  </motion.div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Enter your email
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    We'll send you a verification code
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      id="email"
                      className="block w-full rounded-xl border border-gray-200 bg-white py-3 pl-11 pr-4 text-gray-900 placeholder-gray-400 transition-all focus:border-alloro-orange focus:ring-2 focus:ring-alloro-orange/20 focus:outline-none"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>
                </div>

                <motion.button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center rounded-xl bg-alloro-orange px-5 py-3 text-base font-semibold text-white shadow-lg shadow-alloro-orange/30 transition-all hover:bg-alloro-orange/90 hover:shadow-xl hover:shadow-alloro-orange/40 focus:outline-none focus:ring-4 focus:ring-alloro-orange/20 disabled:opacity-50"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </motion.button>
              </motion.form>
            ) : (
              <motion.form
                key="otp-form"
                onSubmit={handleVerifyOtp}
                className="space-y-5"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="text-center mb-6">
                  <motion.div
                    className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-green-100 to-green-50"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <CheckCircle className="h-7 w-7 text-green-500" />
                  </motion.div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Check your email
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    We sent a code to{" "}
                    <span className="font-medium text-gray-700">{email}</span>
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="otp"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Verification Code
                  </label>
                  <input
                    type="text"
                    id="otp"
                    inputMode="numeric"
                    className="block w-full rounded-xl border border-gray-200 bg-white py-4 text-center text-2xl font-bold tracking-[0.5em] text-gray-900 placeholder-gray-300 transition-all focus:border-alloro-orange focus:ring-2 focus:ring-alloro-orange/20 focus:outline-none"
                    placeholder="------"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    maxLength={6}
                    required
                    autoFocus
                  />
                </div>

                <motion.button
                  type="submit"
                  disabled={loading || otp.length < 6}
                  className="flex w-full items-center justify-center rounded-xl bg-alloro-orange px-5 py-3 text-base font-semibold text-white shadow-lg shadow-alloro-orange/30 transition-all hover:bg-alloro-orange/90 hover:shadow-xl hover:shadow-alloro-orange/40 focus:outline-none focus:ring-4 focus:ring-alloro-orange/20 disabled:opacity-50"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <Shield className="mr-2 h-5 w-5" />
                      Verify & Sign In
                    </>
                  )}
                </motion.button>

                <motion.button
                  type="button"
                  onClick={() => {
                    setStep("email");
                    setOtp("");
                    setError("");
                  }}
                  className="w-full text-center text-sm font-medium text-gray-500 hover:text-alloro-orange transition-colors"
                  whileHover={{ x: -4 }}
                >
                  ← Use a different email
                </motion.button>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Footer */}
        <motion.div
          className="mt-6 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <p className="text-xs text-gray-400 flex items-center justify-center gap-1.5">
            <Shield className="w-3.5 h-3.5" />
            Protected by Alloro Security
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
