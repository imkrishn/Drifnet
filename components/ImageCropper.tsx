"use client";

import React, { useEffect, useRef, useState } from "react";
import ReactCrop, { Crop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

interface Props {
  imageSrc: string;
  loading?: boolean;
  onClose: () => void;
  onCropDone: (file: File) => void;
  shape: "rect" | "round";
  aspect?: number;
  maxOutputSize?: number;
}

export default function ImageCropper({
  imageSrc,
  loading = false,
  onClose,
  onCropDone,
  shape,
  aspect,
  maxOutputSize = 2000,
}: Props) {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [crop, setCrop] = useState<Crop>({
    unit: "%",
    x: 25,
    y: 25,
    width: 50,
    height: 50,
  });

  // reset loaded when imageSrc changes
  useEffect(() => {
    setLoaded(false);
  }, [imageSrc]);

  const getCroppedImage = async (): Promise<File> => {
    if (!imgRef.current || !crop.width || !crop.height) {
      throw new Error("Invalid crop dimensions");
    }
    const image = imgRef.current;
    const nw = image.naturalWidth;
    const nh = image.naturalHeight;
    const dw = image.width;
    const dh = image.height;

    // compute pixel coordinates for the crop
    let pixelX: number, pixelY: number, pixelWidth: number, pixelHeight: number;

    if (crop.unit === "%") {
      pixelX = ((crop.x ?? 0) / 100) * nw;
      pixelY = ((crop.y ?? 0) / 100) * nh;
      pixelWidth = ((crop.width ?? 0) / 100) * nw;
      pixelHeight = ((crop.height ?? 0) / 100) * nh;
    } else {
      // unit is px (values relative to displayed image) -> scale to natural pixels
      const scaleX = nw / dw;
      const scaleY = nh / dh;
      pixelX = (crop.x ?? 0) * scaleX;
      pixelY = (crop.y ?? 0) * scaleY;
      pixelWidth = (crop.width ?? 0) * scaleX;
      pixelHeight = (crop.height ?? 0) * scaleY;
    }

    // clamp & round
    pixelX = Math.max(0, Math.round(pixelX));
    pixelY = Math.max(0, Math.round(pixelY));
    pixelWidth = Math.max(1, Math.round(pixelWidth));
    pixelHeight = Math.max(1, Math.round(pixelHeight));

    // if maxOutputSize is set, scale down output to keep it reasonable
    const maxDim = Math.max(pixelWidth, pixelHeight);
    let outputWidth = pixelWidth;
    let outputHeight = pixelHeight;
    if (maxDim > maxOutputSize) {
      const scale = maxOutputSize / maxDim;
      outputWidth = Math.round(pixelWidth * scale);
      outputHeight = Math.round(pixelHeight * scale);
    }

    // For round shape, produce a square canvas centered in the crop area
    let sx = pixelX;
    let sy = pixelY;
    let sWidth = pixelWidth;
    let sHeight = pixelHeight;
    let canvasWidth = outputWidth;
    let canvasHeight = outputHeight;

    if (shape === "round") {
      // ensure square source to produce a perfect circle
      const size = Math.min(pixelWidth, pixelHeight);
      // center the square inside the selected rectangle
      sx = pixelX + Math.round((pixelWidth - size) / 2);
      sy = pixelY + Math.round((pixelHeight - size) / 2);
      sWidth = size;
      sHeight = size;
      canvasWidth = canvasHeight = Math.min(outputWidth, outputHeight);
    }

    const canvas = document.createElement("canvas");
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas not supported");

    // if round, clip to circle
    if (shape === "round") {
      ctx.beginPath();
      ctx.arc(
        canvasWidth / 2,
        canvasHeight / 2,
        canvasWidth / 2,
        0,
        Math.PI * 2
      );
      ctx.closePath();
      ctx.clip();
    }

    // draw the chosen source region into the canvas (scaled to output size)
    ctx.drawImage(
      image,
      sx,
      sy,
      sWidth,
      sHeight,
      0,
      0,
      canvasWidth,
      canvasHeight
    );

    return new Promise<File>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) return reject("Failed to create blob from canvas");
        // name the file according to shape
        const ext = "png";
        const file = new File([blob], `cropped.${ext}`, { type: "image/png" });
        resolve(file);
      }, "image/png");
    });
  };

  const handleCropDone = async () => {
    try {
      const croppedFile = await getCroppedImage();
      onCropDone(croppedFile);
    } catch (err) {
      console.error("Cropping error:", err);
      alert("Something went wrong while cropping");
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-xl w-[90vw] max-w-3xl">
      <div className="relative w-full h-[420px] bg-gray-100 flex items-center justify-center overflow-hidden">
        <ReactCrop
          crop={crop}
          onChange={(c) => setCrop(c)}
          keepSelection
          aspect={aspect}
          circularCrop={shape === "round"}
          disabled={loading}
        >
          <img
            ref={imgRef}
            src={imageSrc}
            alt="to crop"
            onLoad={() => setLoaded(true)}
            style={{
              maxHeight: "420px",
              display: "block",
              opacity: loaded ? 1 : 0,
              transition: "opacity 280ms ease-in-out",
              width: "auto",
              height: "100%",
            }}
          />
        </ReactCrop>
      </div>

      <div className="flex justify-between mt-4 items-center gap-4">
        <button
          className="bg-gray-400 px-4 py-1 rounded-md"
          onClick={onClose}
          disabled={loading}
        >
          Cancel
        </button>

        <div className="flex items-center gap-3">
          <button
            className="px-4 py-1 rounded-md border"
            onClick={() => {
              // quick fit to center square (useful for avatars)
              setCrop((c) => ({ ...c, width: 50, height: 50, x: 25, y: 25 }));
            }}
            type="button"
            disabled={loading}
          >
            Reset
          </button>

          <button
            disabled={loading}
            className={`bg-blue-600 text-white px-4 py-1 rounded-md ${
              loading ? "opacity-80" : ""
            }`}
            onClick={handleCropDone}
          >
            {loading ? "Cropping..." : "Crop"}
          </button>
        </div>
      </div>
    </div>
  );
}
