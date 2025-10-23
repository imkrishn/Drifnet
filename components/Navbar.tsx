"use client";

import React, { useEffect } from "react";
import Logo from "./Logo";
import { LoginBtn, RegisterBtn } from "./Buttons";
import { Menu } from "lucide-react";
import { AppDispatch, RootState } from "../redux/store";
import { useDispatch, useSelector } from "react-redux";
import { toggleSidebar } from "../redux/slices/sidebarCollapseSlice";
import Image from "next/image";
import Setting from "./Setting";
import { LoggedInUser } from "@/types/userTypes";

const Navbar = ({
  isAuthorized,
  userInfo,
}: {
  isAuthorized: "true" | "false" | null;
  userInfo: LoggedInUser;
}) => {
  const [isOpenSetting, setIsOpenSetting] = React.useState(false);
  const [imgUrl, setImgUrl] = React.useState(
    userInfo?.imgUrl ? userInfo.imgUrl : ""
  );

  const dispatch = useDispatch<AppDispatch>();
  const dispachedImgUrl = useSelector(
    (state: RootState) => state.currentUser.url
  );

  function handleSidebarCollapse() {
    dispatch(toggleSidebar());
  }

  useEffect(() => {
    if (dispachedImgUrl) setImgUrl(dispachedImgUrl);
  }, [dispachedImgUrl]);

  return (
    <nav className="flex p-4 px-8 relative items-center select-none drop-shadow-[0_4px_3px_rgba(0,0,0,0.12)]">
      {userInfo && (
        <Setting
          open={isOpenSetting}
          onClose={() => setIsOpenSetting(false)}
          user={userInfo}
        />
      )}

      <Menu className="cursor-pointer" onClick={handleSidebarCollapse} />
      <Logo />

      {/* Right side */}
      <div className="lg:text-sm text-xs flex items-center justify-end gap-2 ml-auto">
        {isAuthorized === "false" && (
          <>
            <LoginBtn />
            <RegisterBtn />
          </>
        )}

        {isAuthorized === "true" && userInfo && (
          <div className="flex gap-4 items-center justify-center">
            <button
              onClick={() =>
                (window.location.href = `${process.env.NEXT_PUBLIC_URL}/studio/${userInfo.id}`)
              }
              className="cursor-pointer whitespace-nowrap rounded-md p-2 text-white bg-[hsl(var(--primary))] text-xs font-medium hover:opactiy-80"
            >
              Manage Studio
            </button>
            <Image
              onClick={() => setIsOpenSetting(true)}
              src={imgUrl}
              alt="User Avatar"
              width={35}
              height={35}
              className="rounded-full object-cover cursor-pointer"
            />
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
