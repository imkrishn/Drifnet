import Image from "next/image";
import React from "react";

const Logo = () => {
  return (
    <div className="font-extrabold lg:text-xl text-sm w-full text-[#2289FF] flex  items-center">
      <Image src="/logo.png" alt="DrifNet Logo" width={40} height={40} />
      <span>
        Drif<p className="lg:text-2xl text-xl text-[#FF5722] inline">Net</p>
      </span>
    </div>
  );
};

export default Logo;
