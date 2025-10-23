"use client";
import React, { useState } from "react";
import { X, UploadCloud, Trash2 } from "lucide-react";
import { Community } from "@/types/userTypes";
import gql from "graphql-tag";
import { useMutation } from "@apollo/client/react";
import { toast } from "sonner";
import { PostResponse } from "@/types/postType";
import { cn } from "@/lib/utils";
import WarningModal from "./WarningAlert";
import Image from "next/image";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const CREATE_POST = gql`
  mutation CreatePost($data: PostInput!) {
    createPost(data: $data) {
      success
      message
      warnAI
    }
  }
`;

const CreatePostModal = ({
  isOpen,
  onClose,
  userId,
  communities,
}: {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  communities: Community[];
}) => {
  const [form, setForm] = useState({
    title: "",
    description: "",
    communityId: "",
  });

  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [warningAlert, setWarningAlert] = useState<boolean>(false);
  const [warnAIMessage, setWarnAIMessage] = useState<string | null>(null);
  const [createPost] = useMutation<PostResponse>(CREATE_POST);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (!e.target.files) return;

    const selectedFiles = Array.from(e.target.files);
    const validFiles: File[] = [];

    for (const file of selectedFiles) {
      if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
        setError("Only images and videos are allowed.");
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        setError("Each file must be smaller than 10MB.");
        continue;
      }
      validFiles.push(file);
    }

    setFiles((prev) => [...prev, ...validFiles]);
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    try {
      if (!userId)
        return toast.error("User not Authenticated to peform action");

      const { title, description, communityId } = form;

      if (!title || !description) return toast.error(" * fields are required");

      setLoading(true);

      let imgUrls = [];

      if (files.length > 0) {
        const resImage = await fetch(
          `${process.env.NEXT_PUBLIC_URL}/api/upload`,
          {
            method: "POST",
            body: (() => {
              const formData = new FormData();
              files.forEach((file) =>
                formData.append("files", file, file.name)
              );
              return formData;
            })(),
          }
        );

        if (!resImage.ok) return toast.error("Image upload failed");
        const result = await resImage.json();
        imgUrls = result.files.map(
          (file: { original: string }) => file.original
        );
      }

      const postResponse = await createPost({
        variables: {
          data: {
            title,
            body: description,
            communityId,
            imgUrls,
            userId,
          },
        },
      });

      if (!postResponse.data) return;

      if (postResponse.data.createPost.success) {
        if (postResponse.data.createPost.warnAI) {
          setWarningAlert(true);
          setWarnAIMessage(postResponse.data.createPost.warnAI);
          return;
        }
        toast.success(postResponse.data.createPost.message);
        setForm({ title: "", description: "", communityId: "" });
        setFiles([]);
        window.location.href = process.env.NEXT_PUBLIC_URL!;
        onClose();
      } else {
        toast.error(postResponse.data.createPost.message);
      }
    } catch (Err) {
      console.error(Err);
      toast.error("Failed to create Post");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Blur Background */}
      <div
        className="fixed inset-0 backdrop-blur-md bg-black/30"
        onClick={onClose}
      />
      <WarningModal
        open={warningAlert}
        onClose={() => {
          setWarningAlert(false);
          setWarnAIMessage(null);
        }}
        onConfirm={() => {
          setWarningAlert(false);
          setWarnAIMessage(null);
        }}
        message={warnAIMessage as string}
      />
      <div className="relative flex items-center justify-center min-h-screen p-4">
        <div className="relative w-full max-w-lg rounded-xl sm:text-base text-sm p-5 sm:p-6 m-3 shadow-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--input))] z-10">
          {/* header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg sm:text-xl font-semibold text-[hsl(var(--foreground))]">
              Create a Post
            </h2>
            <button
              onClick={onClose}
              className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
            >
              <X size={20} />
            </button>
          </div>

          {/* title */}
          <div className="mb-3">
            <label className="block text-sm mb-1 text-[hsl(var(--muted-foreground))]">
              Title
              <p className="text-red-700 inline">*</p>
            </label>
            <input
              disabled={loading}
              type="text"
              name="title"
              value={form.title}
              onChange={handleInputChange}
              className="w-full p-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--popover))] text-[hsl(var(--input))] outline-none"
              placeholder="Enter post title"
            />
          </div>

          {/* description */}
          <div className="mb-3">
            <label className="block text-sm mb-1 text-[hsl(var(--muted-foreground))]">
              Description
              <p className="text-red-700 inline">*</p>
            </label>
            <textarea
              disabled={loading}
              value={form.description}
              name="description"
              onChange={handleInputChange}
              className="w-full p-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--popover))] text-[hsl(var(--input))] outline-none"
              rows={4}
              placeholder="Write something..."
            />
          </div>

          {/* file Upload */}
          <div className="mb-3">
            <label className="block text-sm mb-1 text-[hsl(var(--muted-foreground))]">
              Upload Images/Videos
            </label>

            <label
              htmlFor="fileUpload"
              className="flex flex-col items-center justify-center w-full border-2 border-dashed border-[hsl(var(--border))] rounded-lg p-6 cursor-pointer bg-[hsl(var(--popover))] hover:bg-[hsl(var(--accent))] transition"
            >
              <UploadCloud
                className="mb-2 text-[hsl(var(--muted-foreground))]"
                size={28}
              />
              <p className="text-xs sm:text-sm text-[hsl(var(--muted-foreground))] text-center">
                Drag & drop or click to upload
              </p>
            </label>
            <input
              disabled={loading}
              type="file"
              id="fileUpload"
              accept="image/*,video/*"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />

            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

            {/* preview Files */}
            {files.length > 0 && (
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
                {files.map((file, i) => (
                  <div key={i} className="relative group">
                    {file.type.startsWith("image/") ? (
                      <Image
                        height={100}
                        width={100}
                        src={URL.createObjectURL(file)}
                        alt={file.name}
                        className="w-full h-24 object-cover rounded-lg border"
                      />
                    ) : (
                      <video
                        src={URL.createObjectURL(file)}
                        className="w-full h-24 object-cover rounded-lg border"
                        controls
                      />
                    )}
                    <Trash2
                      size={20}
                      onClick={() => handleRemoveFile(i)}
                      className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* community Dropdown */}
          <div className="mb-5">
            <label className="block text-sm mb-1 text-[hsl(var(--muted-foreground))]">
              Select Community
            </label>
            <select
              disabled={loading}
              name="communityId"
              onChange={handleInputChange}
              className="w-full p-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--popover))] text-[hsl(var(--input))] outline-none"
            >
              <option value="">None</option>
              {communities.map(({ id, name }) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className={cn(
              "w-full py-2 rounded-lg bg-[hsl(var(--primary))] text-white font-medium hover:opacity-90 transition",
              {
                "opacity-70": loading,
              }
            )}
          >
            {loading ? "Posting..." : "Post"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreatePostModal;
