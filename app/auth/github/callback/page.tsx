// /auth/github/callback

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Handshake } from "lucide-react";

export default function GithubCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const url = new URL(window.location.href);
    const code = url.searchParams.get("code");

    if (code) {
      fetch(
        `${process.env.NEXT_PUBLIC_URL}/api/auth/github/callback?code=${code}`,
        {
          method: "GET",
          credentials: "include",
        }
      )
        .then(async (res) => {
          if (res.ok) {
            router.push("/");
          } else {
            const err = await res.json();
            console.error("Auth error:", err);
            router.push("/auth/login");
          }
        })
        .catch(() => {
          router.push("/auth/login");
        });
    } else {
      router.push("/auth/login");
    }
  }, [router]);

  return (
    <div className="h-screen w-screen flex justify-center items-center font-bold flex-col gap-4 text-[#464444]">
      <div className="flex gap-4 items-center">
        <Image
          src={"/github.png"}
          width={100}
          height={100}
          alt="github..."
          className=" rounded-full"
        />
        <Handshake size={33} />
        <Image
          src={"/logo.png"}
          width={100}
          height={100}
          alt="logo..."
          className=" rounded-full"
        />
      </div>
      <p>Logging in with GitHub...</p>
    </div>
  );
}
