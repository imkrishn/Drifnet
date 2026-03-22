export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import cloudinary from "@/lib/cloudinary";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const files = formData
      .getAll("files")
      .filter((f) => f instanceof File) as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files uploaded" }, { status: 400 });
    }

    const uploadPromises = files.map(async (file) => {
      const buffer = Buffer.from(await file.arrayBuffer());

      return new Promise<{ original: string; cropped: string }>(
        (resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: "posts",
              resource_type: "auto",
            },
            (error, result) => {
              if (error) return reject(error);
              if (!result?.secure_url)
                return reject(new Error("Upload failed: missing secure_url"));

              const secureUrl = result.secure_url;
              resolve({
                original: secureUrl,
                cropped: secureUrl.replace(
                  "/upload/",
                  "/upload/c_fill,g_auto,w_600,h_600/"
                ),
              });
            }
          );

          uploadStream.end(buffer);
        }
      );
    });

    const results = await Promise.all(uploadPromises);

    return NextResponse.json({ files: results });
  } catch (error: any) {
    console.error("Cloudinary Upload Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
