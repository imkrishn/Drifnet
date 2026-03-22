"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Moon, Sun, LogOut } from "lucide-react";
import { useTheme } from "next-themes";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { LoggedInUser, SignoutResponse } from "@/types/userTypes";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import gql from "graphql-tag";
import { useMutation } from "@apollo/client/react";
import { toast } from "sonner";

interface SettingProps {
  open: boolean;
  onClose: () => void;
  user: LoggedInUser;
}

const SIGNOUT = gql`
  mutation Signout($loggedInUserId: ID!) {
    signout(loggedInUserId: $loggedInUserId) {
      success
      message
    }
  }
`;

export default function Setting({ open, onClose, user }: SettingProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  const dispatchedUser = useSelector((state: RootState) => state.currentUser);

  const onToggleTheme = () => setTheme(theme === "light" ? "dark" : "light");

  const [signout, { loading }] = useMutation<SignoutResponse>(SIGNOUT);

  const onSignOut = async () => {
    if (!user) return;
    try {
      const { data } = await signout({
        variables: {
          loggedInUserId: user?.id,
        },
      });

      if (data?.signout.success) {
        window.location.href = `${process.env.NEXT_PUBLIC_URL}/auth/login`;
      }
    } catch (err) {
      console.error("Error while signout : ", err);
      toast.error("Failed to logout .Try again");
    }
  };

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div
          aria-modal="true"
          role="dialog"
          className="fixed inset-0 z-[9999] flex items-start justify-end"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            style={{ zIndex: 10 }}
          />

          <div className="relative w-full flex items-start justify-end p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.18 }}
              className="pointer-events-auto relative w-80 md:w-72 bg-[hsl(var(--background))] text-[hsl(var(--foreground))] rounded-xl shadow-2xl p-5"
              style={{ zIndex: 20, border: "1px solid rgba(0,0,0,0.04)" }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header / user */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-[hsl(var(--primary))]">
                  {user?.imgUrl ? (
                    <Image
                      src={
                        dispatchedUser.url ? dispatchedUser.url : user.imgUrl
                      }
                      alt={user.name}
                      width={56}
                      height={56}
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-[hsl(var(--muted))] flex items-center justify-center text-[hsl(var(--muted-foreground))]">
                      {user?.name?.[0]?.toUpperCase() ?? "UnKnown"}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold truncate">
                      {dispatchedUser.name ? dispatchedUser.name : user?.name}
                    </h3>
                  </div>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] truncate">
                    {user?.email ?? "—"}
                  </p>
                </div>
              </div>

              <div className="flex justify-between gap-4 text-center mb-4">
                <div className="flex-1">
                  <p className="text-lg font-semibold">
                    {user?._count.follower}
                  </p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">
                    Followers
                  </p>
                </div>
                <div className="flex-1">
                  <p className="text-lg font-semibold">
                    {user?._count.following}
                  </p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">
                    Following
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <button
                  onClick={onToggleTheme}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg bg-[hsl(var(--muted))] hover:bg-[hsl(var(--muted)/0.9)] transition"
                >
                  {theme === "light" ? (
                    <Moon className="w-4 h-4" />
                  ) : (
                    <Sun className="w-4 h-4" />
                  )}
                  <span className="text-sm">
                    {theme === "dark" ? "Light" : "Dark"} Mode
                  </span>
                </button>

                <button
                  onClick={onSignOut}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg bg-[hsl(var(--primary))] text-[hsl(var(--destructive-foreground))] hover:opacity-95 transition"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm">
                    {loading ? "Signing Out" : "Sign Out"}
                  </span>
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
