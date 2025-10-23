"use client";

import { GithubBtn } from "../../../components/Buttons";
import Logo from "../../../components/Logo";
import { cn } from "../../../lib/utils";
import { Check, Eye, EyeClosed, Lock, Mail, User, X } from "lucide-react";
import Image from "next/image";
import React from "react";
import { toast } from "sonner";
import gql from "graphql-tag";
import { useLazyQuery, useMutation } from "@apollo/client/react";
import {
  UserGetResponse,
  UserCreateResponse,
  UserUpdateResponse,
} from "@/types/userTypes";
import bcrypt from "bcryptjs";

const validity = [
  "At least one lowercase",
  "At least one uppercase",
  "At least one number",
  "Minimum 8 characters",
];

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const CREATE_USER = gql`
  mutation CreateUser($email: String!, $name: String!) {
    createUser(email: $email, name: $name) {
      success
      message
      user {
        id
        isVerified
      }
    }
  }
`;

const UPDATE_USER = gql`
  mutation UpdateUser($id: String!, $data: UpdateUserInput!) {
    updateUser(id: $id, data: $data) {
      success
      message
    }
  }
`;

const LIST_USER_BY_EMAIL = gql`
  query ListUserByEmail($email: String!) {
    listUserByEmail(email: $email) {
      success
      message
      data {
        id
        verificationToken
        verificationTokenTime
      }
    }
  }
`;

const Register = () => {
  const [loading, setLoading] = React.useState(false);
  const [errors, setErrors] = React.useState<string[]>([]);
  const [step, setStep] = React.useState<"email" | "details">("email");
  const [showPassword, setShowPassword] = React.useState<"password" | "text">(
    "password"
  );
  const [createUser] = useMutation<UserCreateResponse>(CREATE_USER);
  const [updateUser] = useMutation<UserUpdateResponse>(UPDATE_USER);
  const [listUserByEmail] = useLazyQuery<UserGetResponse>(LIST_USER_BY_EMAIL);

  const [form, setForm] = React.useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    otp: "",
  });

  function handleOnChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  //  password rule checker
  React.useEffect(() => {
    const newErrors: string[] = [];
    if (!/[a-z]/.test(form.password)) newErrors.push("At least one lowercase");
    if (!/[A-Z]/.test(form.password)) newErrors.push("At least one uppercase");
    if (!/[0-9]/.test(form.password)) newErrors.push("At least one number");
    if (form.password.length < 8) newErrors.push("Minimum 8 characters");
    setErrors(newErrors);
  }, [form.password]);

  //  send OTP

  async function sendOtp(): Promise<"success" | "failed"> {
    try {
      const email = form.email.trim();
      const name = form.name.trim();

      if (!name.trim() || !email || !emailRegex.test(email)) {
        toast.error("Enter a valid name or email.");
        return "failed";
      }

      setLoading(true);

      const result = await createUser({
        variables: { email, name },
      });

      const response = result?.data;
      if (!response) {
        toast.error("Unexpected server response.");
        return "failed";
      }

      if (!response.createUser.success) {
        toast.error(response.createUser.message);
        return "failed";
      }

      toast.success(response.createUser.message);
      setStep("details");
      return "success";
    } catch (error) {
      console.error("OTP Error:", error);
      toast.error("Failed to send OTP. Try again.");
      return "failed";
    } finally {
      setLoading(false);
    }
  }

  //  submit form

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (errors.length > 0) {
      toast.error("Password does not meet requirements.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      toast.error("Password does not match.");
      return;
    }

    try {
      setLoading(true);

      const user = await listUserByEmail({
        variables: { email: form.email },
      });

      const res = user.data?.listUserByEmail;
      if (res?.success && res.data.length > 0) {
        const { id, verificationToken, verificationTokenTime } = res.data[0];

        const expiryTime = Number(verificationTokenTime);
        const now = Number(Date.now().toString());

        const isNotExpired = expiryTime > now;

        const correctOtp = verificationToken === form.otp && isNotExpired;

        if (!correctOtp) return toast.error("OTP is wrong or expired.");

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(form.password, salt);

        const response = await updateUser({
          variables: {
            id,
            data: {
              verificationToken: null,
              verificationTokenTime: null,
              password: hashedPassword,
              isVerified: true,
            },
          },
        });

        if (response.data?.updateUser.success) {
          toast.success("User created successfully");
          window.location.href = `${process.env.NEXT_PUBLIC_URL}/auth/login`;
        }
      } else {
        return toast.error("User not exists.");
      }
    } catch (err) {
      toast.error("Something went wrong.");
      console.error("Error while signup :", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex justify-center items-center flex-col gap-2 lg:px-48 p-6">
      <Logo />
      <Image src="/logo.png" alt="Login Background" width={100} height={100} />
      <p className="lg:text-xl font-bold text-center">
        Communities thrive on connections — make yours now
      </p>

      <GithubBtn />
      <p>OR</p>

      <form onSubmit={handleSubmit} className="lg:w-1/2 text-[#696565]">
        {step === "email" && (
          <>
            <div className="my-3 rounded-lg bg-[#F3F0F0] flex gap-1 items-center p-3">
              <User />
              <input
                onChange={handleOnChange}
                name="name"
                disabled={loading}
                type="text"
                placeholder="Full name"
                className="px-4 w-full outline-none bg-transparent"
              />
            </div>
            <div className="my-3 rounded-lg bg-[#F3F0F0] flex gap-1 items-center p-3">
              <Mail />
              <input
                onChange={handleOnChange}
                name="email"
                disabled={loading}
                type="email"
                placeholder="Email"
                className="px-4 w-full outline-none bg-transparent"
              />
            </div>
            <button
              onClick={sendOtp}
              disabled={loading}
              className={cn(
                "rounded-lg w-full text-center m-auto  text-sm font-bold cursor-pointer px-3 py-2 text-white active:scale-95 select-none",
                loading ? "bg-[#f87c56] cursor-default" : "bg-[#FF5722]"
              )}
            >
              {loading ? "Sending..." : "Send Otp"}
            </button>
          </>
        )}

        {step === "details" && (
          <>
            <div className="my-3 rounded-lg bg-[#F3F0F0] flex gap-1 items-center p-3">
              <input
                onChange={handleOnChange}
                name="otp"
                disabled={loading}
                type="text"
                placeholder="Enter OTP"
                className="px-4 w-full outline-none bg-transparent"
              />
            </div>

            <div className="my-3 rounded-lg bg-[#F3F0F0] flex gap-1 items-center p-3">
              <Lock size={20} />
              <input
                onChange={handleOnChange}
                name="password"
                disabled={loading}
                type={showPassword}
                placeholder="Password"
                className="px-4 w-full outline-none bg-transparent"
              />
              {showPassword === "password" ? (
                <EyeClosed
                  onClick={() => setShowPassword("text")}
                  className="cursor-pointer"
                />
              ) : (
                <Eye
                  onClick={() => setShowPassword("password")}
                  className="cursor-pointer"
                />
              )}
            </div>

            <div className="my-3 rounded-lg bg-[#F3F0F0] flex gap-1 items-center p-3">
              <Lock size={20} />
              <input
                onChange={handleOnChange}
                name="confirmPassword"
                disabled={loading}
                type="password"
                placeholder="Confirm Password"
                className="px-4 w-full outline-none bg-transparent"
              />
            </div>

            <div className="text-[14px] p-2.5">
              {validity.map((rule, index) =>
                errors.includes(rule) ? (
                  <p
                    key={index}
                    className="flex gap-2 items-center text-[#F80F13]"
                  >
                    <X /> {rule}
                  </p>
                ) : (
                  <p
                    key={index}
                    className="flex gap-2 items-center text-[#12AD34]"
                  >
                    <Check /> {rule}
                  </p>
                )
              )}
            </div>

            <button
              type="submit"
              className={cn(
                "text-white font-bold px-3 w-full py-2 cursor-pointer active:scale-[.96] rounded-md lg:text-sm text-xs shadow-lg",
                loading ? "bg-[#f87c56] cursor-default" : "bg-[#FF5722]"
              )}
              disabled={loading}
            >
              {loading ? "Loading..." : "Signup"}
            </button>
          </>
        )}
      </form>
    </main>
  );
};

export default Register;
