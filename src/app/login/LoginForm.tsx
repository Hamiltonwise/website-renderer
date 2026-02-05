"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Loader2, CheckCircle2 } from "lucide-react";

type OTPStep = "email" | "code" | "verifying";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<OTPStep>("email");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isTestAccount, setIsTestAccount] = useState(false);

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    setIsTestAccount(false);

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

      setStep("code");
      if (data.isTestAccount) {
        setIsTestAccount(true);
        setMessage("You are a tester, type anything and proceed");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setStep("verifying");
    setError("");
    
    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Invalid code");
      }

      // Store token in cookie
      document.cookie = `auth_token=${data.token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;

      // Broadcast login event for cross-app sync
      const channel = new BroadcastChannel("auth_channel");
      channel.postMessage({ type: "login", token: data.token });
      channel.close();

      // Show success briefly before redirect
      setMessage("Success! Redirecting...");
      setTimeout(() => {
        router.push(redirectTo);
        router.refresh();
      }, 800);
    } catch (err: any) {
      setError(err.message);
      setStep("code");
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (value: string) => {
    const sanitized = value.replace(/\D/g, "").slice(0, 6);
    setCode(sanitized);
    
    // Auto-submit when 6 digits entered
    if (sanitized.length === 6 && !loading) {
      setTimeout(() => handleVerifyOTP(), 300);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !loading) {
      if (step === "email") {
        handleRequestOTP(e);
      } else if (step === "code" && code.length === 6) {
        handleVerifyOTP();
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-alloro-bg font-sans">
      <div className="max-w-md w-full">
        {/* Main Card */}
        <div className="relative p-8 rounded-2xl bg-white border border-slate-200 shadow-[0_4px_24px_rgba(0,0,0,0.08)]">
          {/* Logo/Brand */}
          <div className="flex justify-center mb-6">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-alloro-orange to-brand-600 shadow-lg shadow-alloro-orange/20 flex items-center justify-center">
              <span className="text-2xl font-bold text-white">W</span>
            </div>
          </div>

          {/* Welcome Message */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-alloro-navy tracking-tight mb-2">
              Website Builder
            </h1>
            <p className="text-slate-500 text-sm">
              Admin access · Sign in to continue
            </p>
          </div>

          {/* Error/Success Messages */}
          <AnimatePresence mode="wait">
            {(error || message) && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`mb-4 p-3 rounded-lg text-center text-sm ${
                  error
                    ? "bg-red-50 text-red-700 border border-red-200"
                    : "bg-green-50 text-green-700 border border-green-200"
                }`}
              >
                {error || message}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Step Indicator */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <div
              className={`flex items-center gap-2 ${
                step === "email" ? "text-alloro-orange" : "text-slate-400"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                  step === "email"
                    ? "bg-alloro-orange text-white"
                    : "bg-slate-200 text-slate-500"
                }`}
              >
                1
              </div>
              <span className="text-xs font-medium hidden sm:inline">Email</span>
            </div>
            <div className="w-8 h-px bg-slate-300" />
            <div
              className={`flex items-center gap-2 ${
                step === "code" || step === "verifying"
                  ? "text-alloro-orange"
                  : "text-slate-400"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                  step === "code" || step === "verifying"
                    ? "bg-alloro-orange text-white"
                    : "bg-slate-200 text-slate-500"
                }`}
              >
                {step === "verifying" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "2"
                )}
              </div>
              <span className="text-xs font-medium hidden sm:inline">Verify</span>
            </div>
          </div>

          {/* Content */}
          <AnimatePresence mode="wait">
            {step === "email" ? (
              <motion.form
                key="email-step"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                onSubmit={handleRequestOTP}
                className="space-y-4"
              >
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-alloro-navy mb-2"
                  >
                    Admin Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="admin@example.com"
                    className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-alloro-orange/20 focus:border-alloro-orange outline-none transition-all placeholder:text-slate-400"
                    disabled={loading}
                    autoFocus
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)}
                  className="w-full py-3 px-4 bg-alloro-orange hover:bg-brand-600 text-white font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 shadow-lg shadow-alloro-orange/20"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Sending code...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4" />
                      Send Verification Code
                    </>
                  )}
                </button>
              </motion.form>
            ) : (
              <motion.form
                key="code-step"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                onSubmit={handleVerifyOTP}
                className="space-y-4"
              >
                <div className="text-center mb-4">
                  {isTestAccount ? (
                    <p className="text-sm text-green-600 font-semibold">
                      You are a tester, type anything and proceed
                    </p>
                  ) : (
                    <>
                      <p className="text-sm text-slate-600 font-medium">Code sent to</p>
                      <p className="text-sm text-alloro-orange font-semibold">{email}</p>
                    </>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="code"
                    className="block text-sm font-medium text-alloro-navy mb-2"
                  >
                    Verification Code
                  </label>
                  <input
                    id="code"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={code}
                    onChange={(e) => handleCodeChange(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="000000"
                    maxLength={6}
                    className="w-full px-4 py-4 bg-white border-2 border-slate-300 rounded-xl focus:ring-2 focus:ring-alloro-orange/20 focus:border-alloro-orange outline-none transition-all text-center tracking-[0.5em] font-mono text-2xl font-bold placeholder:tracking-normal placeholder:text-base text-alloro-navy"
                    disabled={loading}
                    autoFocus
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || code.length !== 6}
                  className="w-full py-3 px-4 bg-alloro-orange hover:bg-brand-600 text-white font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 shadow-lg shadow-alloro-orange/20"
                >
                  {step === "verifying" ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Verify & Sign In
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStep("email");
                    setCode("");
                    setError("");
                    setMessage("");
                  }}
                  disabled={loading}
                  className="w-full text-sm text-slate-500 hover:text-alloro-orange transition-colors disabled:opacity-50"
                >
                  Use a different email
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        {/* Help Text */}
        <div className="text-center mt-6">
          <p className="text-slate-500 text-sm">
            Protected admin area · Authorized access only
          </p>
        </div>
      </div>
    </div>
  );
}
