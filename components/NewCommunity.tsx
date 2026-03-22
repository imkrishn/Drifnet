"use client";

import { cn } from "@/lib/utils";
import { CommunityResponse } from "@/types/communityTypes";
import { Community } from "@/types/userTypes";
import { useMutation } from "@apollo/client/react";
import gql from "graphql-tag";
import Image from "next/image";
import React, { Dispatch, SetStateAction, useState } from "react";
import { toast } from "sonner";

interface CreateCommunityModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  setCommunities: Dispatch<SetStateAction<{ community: Community }[]>>;
}

const CREATE_COMMUNITY = gql`
  mutation CreateCommunity($data: CreateCommunityInput!) {
    createCommunity(data: $data) {
      success
      message
      data {
        id
        ownerId
        name
      }
    }
  }
`;

export default function CreateCommunity({
  open,
  onClose,
  userId,
  setCommunities,
}: CreateCommunityModalProps) {
  const [createCommunity] = useMutation<CommunityResponse>(CREATE_COMMUNITY);
  const [logo, setLogo] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [data, setData] = useState<{
    name: string;
    description: string;
    file: File | null;
  }>({
    name: "",
    description: "",
    file: null,
  });

  //handle files

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogo(URL.createObjectURL(file));
      setData({ ...data, file });
    }
  };

  //handle inputs

  function handleOnChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    setData({ ...data, [name]: value });
  }

  //handle submit

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { name, description, file } = data;
    if (!name.trim() || !description.trim() || !file || !userId) {
      return toast.error("All fields are required.");
    }

    setLoading(true);

    try {
      const resImage = await fetch(
        `${process.env.NEXT_PUBLIC_URL}/api/upload`,
        {
          method: "POST",
          body: (() => {
            const formData = new FormData();
            formData.append("files", file);
            return formData;
          })(),
        }
      );

      if (!resImage.ok) return toast.error("Image upload failed");

      const result = await resImage.json();
      const imgUrl = result.files[0].cropped;
      if (!imgUrl) return toast.error("Image upload failed");

      //create community
      const { data } = await createCommunity({
        variables: {
          data: {
            name,
            description,
            imgUrl,
            ownerId: userId,
          },
        },
      });

      if (data?.createCommunity.success) {
        toast.success(data.createCommunity.message);
        if (data.createCommunity.data)
          setCommunities((prev) => [
            { community: data.createCommunity.data },
            ...prev,
          ]);
        setData({ name: "", description: "", file: null });
        setLogo(null);
        onClose();
      } else {
        toast.error(data?.createCommunity.message);
      }
    } catch (Err) {
      console.error(Err);
      toast.error("Failed to create community");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      {/* Background Blur */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        className="relative w-full max-w-md mx-4 rounded-xl shadow-xl p-6 border border-[hsl(var(--border))] 
        bg-[hsl(var(--background))] text-[hsl(var(--foreground))]"
      >
        <h2 className="text-xl font-semibold text-center mb-6">
          Create Community
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* title */}
          <div>
            <label className="block text-sm mb-1 text-[hsl(var(--muted-foreground))]">
              Title
            </label>
            <input
              disabled={loading}
              name="name"
              onChange={handleOnChange}
              type="text"
              placeholder="Enter community name"
              required
              className="w-full px-3 py-2 rounded-lg border border-[hsl(var(--border))] 
                bg-[hsl(var(--popover))] text-[hsl(var(--input))] outline-none "
            />
          </div>

          {/* description */}
          <div>
            <label className="block text-sm mb-1 text-[hsl(var(--muted-foreground))]">
              Description
            </label>
            <textarea
              disabled={loading}
              name="description"
              onChange={handleOnChange}
              placeholder="Write a short description..."
              required
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-[hsl(var(--border))] resize-none
                bg-[hsl(var(--popover))] text-[hsl(var(--input))] outline-none "
            />
          </div>

          {/* logo Upload */}
          <div>
            <label className="block text-sm mb-2 text-[hsl(var(--muted-foreground))]">
              Logo
            </label>
            <div className="flex items-center gap-4">
              <label className="flex flex-col items-center justify-center w-24 h-24 border-2 border-dashed border-[hsl(var(--border))] rounded-lg cursor-pointer hover:bg-[hsl(var(--accent))] transition">
                {logo ? (
                  <Image
                    height={100}
                    width={100}
                    src={logo}
                    alt="Logo preview"
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <span className="text-[hsl(var(--muted-foreground))] text-2xl">
                    +
                  </span>
                )}
                <input
                  disabled={loading}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoUpload}
                />
              </label>

              {logo && (
                <button
                  disabled={loading}
                  type="button"
                  onClick={() => setLogo(null)}
                  className="px-3 py-1 text-sm rounded-lg bg-[hsl(var(--destructive))] text-[hsl(var(--destructive-foreground))] hover:opacity-90"
                >
                  Remove
                </button>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:opacity-90"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={cn(
                "px-4 py-2 rounded-lg bg-[hsl(var(--primary))]  text-[hsl(var(--primary-foreground))] hover:opacity-90",
                loading && "opacity-80 cursor-not-allowed"
              )}
            >
              {loading ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
