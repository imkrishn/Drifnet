"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, KeyRound, Lock } from "lucide-react";
import gql from "graphql-tag";
import { useMutation } from "@apollo/client/react";
import {
  ResetPasswordResponse,
  VerifyResetPasswordResponse,
} from "@/types/userTypes";
import { toast } from "sonner";

const VERIFY_RESET_PASSWORD = gql`
  mutation VerifyResetPassword($email: String!) {
    verifyResetPassword(email: $email) {
      success
      message
    }
  }
`;

const RESET_PASSWORD = gql`
  mutation ResetPassword($email: String!, $otp: String!, $password: String!) {
    resetPassword(email: $email, otp: $otp, password: $password) {
      success
      message
    }
  }
`;

export default function ResetPassword() {
  const [step, setStep] = useState<"email" | "verify">("email");
  const [errors, setErrors] = React.useState<string[]>([]);
  const [form, setForm] = useState({
    email: "",
    otp: "",
    password: "",
    confirm: "",
  });

  const [verifyResetPassword, { loading: verifyPasswordLoading }] =
    useMutation<VerifyResetPasswordResponse>(VERIFY_RESET_PASSWORD);
  const [resetPassword, { loading: resetPasswordLoading }] =
    useMutation<ResetPasswordResponse>(RESET_PASSWORD);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  //  password rule checker
  React.useEffect(() => {
    const newErrors: string[] = [];
    if (!/[a-z]/.test(form.password)) newErrors.push("At least one lowercase");
    if (!/[A-Z]/.test(form.password)) newErrors.push("At least one uppercase");
    if (!/[0-9]/.test(form.password)) newErrors.push("At least one number");
    if (form.password.length < 8) newErrors.push("Minimum 8 characters");
    setErrors(newErrors);
  }, [form.password]);

  const handleSendEmail = async () => {
    if (!form.email.trim()) return toast.warning("Email Required");

    try {
      const { data } = await verifyResetPassword({
        variables: { email: form.email },
      });

      if (data?.verifyResetPassword.success) {
        setStep("verify");
        toast.success(data?.verifyResetPassword.message);
      } else {
        toast.error(data?.verifyResetPassword.message);
      }
    } catch (Err) {
      console.log("Error while verify reset password :", Err);
    }
  };

  const handleReset = async () => {
    if (form.password !== form.confirm)
      return toast.error("Passwords do not match");
    const { email, otp, password } = form;

    if (!otp || !email || !password) return;

    if (errors.length > 0) return toast.error(errors[0]);

    try {
      const { data } = await resetPassword({
        variables: { otp, email, password },
      });

      if (data?.resetPassword.success) {
        toast.success(data?.resetPassword.message);
        window.location.href = `${process.env.NEXT_PUBLIC_URL}/auth/login`;
      } else {
        toast.error(data?.resetPassword.message);
      }
    } catch (err) {
      console.error("Error while reset password:", err);
      toast.error("Failed to reset Password . Try again");
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", stiffness: 180, damping: 20 }}
        className="w-[90%] max-w-md p-8 rounded-2xl shadow-2xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] flex flex-col items-center"
      >
        <AnimatePresence mode="wait">
          {step === "email" ? (
            <motion.div
              key="email-step"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.25 }}
              className="w-full flex flex-col items-center"
            >
              <Mail className="w-16 h-16 text-orange-500 mb-4" />
              <h2 className="text-2xl font-semibold mb-2">Reset Password</h2>
              <p className="text-sm text-muted-foreground mb-6 text-center">
                Enter your registered email and we’ll send an OTP to reset your
                password.
              </p>

              <input
                type="email"
                disabled={verifyPasswordLoading}
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Enter your email"
                className="w-full px-4 py-3 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
              />

              <button
                disabled={verifyPasswordLoading}
                onClick={handleSendEmail}
                className="w-full mt-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold hover:scale-[1.02] active:scale-[0.98] transition-transform"
              >
                {verifyPasswordLoading ? "Sending" : "Send OTP"}
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="verify-step"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.25 }}
              className="w-full flex flex-col items-center"
            >
              <KeyRound className="w-16 h-16 text-orange-500 mb-4" />
              <h2 className="text-2xl font-semibold mb-2">Verify & Reset</h2>
              <p className="text-sm text-muted-foreground mb-6 text-center">
                Enter the OTP we sent to your email and set your new password.
              </p>

              <div className="w-full space-y-3">
                <input
                  disabled={resetPasswordLoading}
                  type="text"
                  name="otp"
                  value={form.otp}
                  onChange={handleChange}
                  placeholder="Enter OTP"
                  className="w-full px-4 py-3 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] focus:ring-2 focus:ring-orange-500 transition-all"
                />
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 text-orange-500 w-5 h-5" />
                  <input
                    disabled={resetPasswordLoading}
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="New Password"
                    className="w-full pl-10 py-3 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] focus:ring-2 focus:ring-orange-500 transition-all"
                  />
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 text-orange-500 w-5 h-5" />
                  <input
                    disabled={resetPasswordLoading}
                    type="password"
                    name="confirm"
                    value={form.confirm}
                    onChange={handleChange}
                    placeholder="Confirm Password"
                    className="w-full pl-10 py-3 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] focus:ring-2 focus:ring-orange-500 transition-all"
                  />
                </div>
              </div>

              <button
                onClick={handleReset}
                className="w-full mt-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold hover:scale-[1.02] active:scale-[0.98] transition-transform"
              >
                {resetPasswordLoading ? "Reseting" : "Reset Password"}
              </button>

              <button
                onClick={() => setStep("email")}
                className="mt-3 text-sm text-orange-500 hover:underline"
              >
                Go Back
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
