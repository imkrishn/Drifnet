"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Handshake } from "lucide-react";

export default function GithubCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState("Logging in with GitHub...");

  useEffect(() => {
    const handleGithubAuth = async () => {
      try {
        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");

        if (!code) {
          setStatus("Missing authorization code. Redirecting...");
          router.replace("/auth/login");
          return;
        }

        const callbackUrl = `${
          process.env.NEXT_PUBLIC_URL
        }/api/auth/github/callback?code=${encodeURIComponent(code)}`;

        const res = await fetch(callbackUrl, {
          method: "GET",
          credentials: "include",
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          console.error("GitHub auth failed:", errorData);

          router.replace("/auth/login");
          return;
        }

        setTimeout(() => router.replace("/"), 800);
      } catch (err) {
        console.error("GitHub callback error:", err);

        router.replace("/auth/login");
      }
    };

    handleGithubAuth();
  }, [router]);

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center gap-4 text-[#444] font-medium">
      <div className="flex gap-4 items-center">
        <Image
          src="/github.png"
          width={100}
          height={100}
          alt="GitHub"
          className="rounded-full"
        />
        <Handshake size={36} />
        <Image
          src="/logo.png"
          width={100}
          height={100}
          alt="Logo"
          className="rounded-full"
        />
      </div>

      <p className="text-lg animate-pulse">{status}</p>
    </div>
  );
}
