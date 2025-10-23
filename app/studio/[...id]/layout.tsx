import Logo from "@/components/Logo";
import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "DrifNet Studio",
  description: "A studio for Drifters",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="h-screen overflow-clip">
      <div className="flex items-center-safe justify-around px-8 p-2 border-b border-[hsl(var(--border))]">
        <Logo />
        <span className="font-bold text-sm w-full underline">STUDIO </span>
        <Image src={"/logo.png"} alt="#logo" width={40} height={40} />
      </div>
      <div className="flex h-full overflow-clip">{children}</div>
    </div>
  );
}
