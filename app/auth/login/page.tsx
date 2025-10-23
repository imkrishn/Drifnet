"use client";

import { Eye, EyeClosed, Lock, Mail } from "lucide-react";
import Image from "next/image";
import React, { useState } from "react";
import Logo from "../../../components/Logo";
import { cn } from "../../../lib/utils";
import { GithubBtn } from "../../../components/Buttons";
import { toast } from "sonner";
import { useMutation } from "@apollo/client/react";
import gql from "graphql-tag";
import { LoginResponse } from "@/types/userTypes";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const LOGIN_USER = gql`
  mutation LoginUser($email: String!, $password: String!) {
    loginUser(email: $email, password: $password) {
      success
      message
    }
  }
`;

const Login = () => {
  const [loginUser, { loading }] = useMutation<LoginResponse>(LOGIN_USER);
  const [showPassword, setShowPassword] = useState<"password" | "text">(
    "password"
  );
  const [formData, setFormData] = useState({ email: "", password: "" });

  function handleOnChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;

    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const { email, password } = formData;

    if (!email || !password.trim() || !emailRegex.test(email)) {
      return toast.error("Credentials are wrong ");
    }

    try {
      const res = await loginUser({
        variables: {
          email,
          password,
        },
      });

      if (res.data?.loginUser.success) {
        window.location.href = process.env.NEXT_PUBLIC_URL!;
      } else {
        toast.error(res.data?.loginUser.message);
      }
    } catch (err) {
      console.error("Error while logging : ", err);
      toast.error("Failed to login");
    }
  }

  return (
    <main className="flex justify-center items-center flex-col gap-2 lg:px-48 p-6">
      <Logo />
      <Image src="/logo.png" alt="Login Background" width={100} height={100} />
      <p className="lg:text-2xl font-bold text-center">
        Swim with the smartest fish in ocean of communities — log in to DrifNet
      </p>
      <form onSubmit={handleSubmit} className="lg:w-1/2 text-[#696565]">
        <div className="my-3 rounded-lg bg-[#F3F0F0] flex gap-1 items-center p-3">
          <Mail />
          <input
            onChange={handleOnChange}
            name="email"
            disabled={loading}
            type="email"
            placeholder="Email"
            className="px-4  w-full  outline-none bg-transparent"
          />
        </div>
        <div className="my-3 rounded-lg bg-[#F3F0F0] flex gap-1 items-center p-3">
          <Lock />
          <input
            onChange={handleOnChange}
            name="password"
            disabled={loading}
            type={showPassword}
            placeholder="Password"
            className="px-4  w-full  outline-none bg-transparent"
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
        <p className="my-2 text-[#3580BE] text-sm text-right cursor-pointer active:scale-[.98]">
          <a href={`${process.env.NEXT_PUBLIC_URL}/auth/forgotPassword`}>
            Forgot Password
          </a>
        </p>
        <button
          type="submit"
          className={cn(
            "text-white font-bold px-3 w-full py-2 cursor-pointer active:scale-[.96] rounded-md lg:text-sm text-xs shadow-lg ",
            loading ? "bg-[#f87c56] cursor-default" : "bg-[#FF5722]"
          )}
          disabled={loading}
        >
          {loading ? "Logging" : "Login"}
        </button>
      </form>
      <p>OR</p>
      <GithubBtn />
      <p className="text-sm">
        Dont&apos;t have an account?{" "}
        <a
          href={`${process.env.NEXT_PUBLIC_URL}/auth/register`}
          className="text-[#FF5722]"
        >
          Register
        </a>
      </p>
    </main>
  );
};

export default Login;
