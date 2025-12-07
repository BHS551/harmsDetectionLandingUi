// src/app/api/screenshots/route.ts
import { NextResponse } from "next/server";
import {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  // creds are taken from env vars: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY
});

export async function GET() {
  try {
    const bucket = process.env.S3_BUCKET_NAME!;
    const prefix = process.env.S3_PREFIX || ""; // "cameras/"

    const listCommand = new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: prefix,
      MaxKeys: 100, // adjust if needed
    });

    const result = await s3.send(listCommand);
    const contents = result.Contents ?? [];

    const items = await Promise.all(
      contents.map(async (obj) => {
        if (!obj.Key) return null;
        const key = obj.Key;

        // Generate signed URL for each object
        const getCommand = new GetObjectCommand({
          Bucket: bucket,
          Key: key,
        });

        const signedUrl = await getSignedUrl(s3, getCommand, {
          expiresIn: 3600, // 1 hour
        });

        return {
          key,
          size: obj.Size ?? 0,
          lastModified: obj.LastModified?.toISOString() ?? null,
          url: signedUrl, // <-- use this in <img src>
        };
      })
    );

    // filter out any nulls (shouldn't happen, but just in case)
    const filtered = items.filter((i): i is NonNullable<typeof i> => Boolean(i));

    return NextResponse.json({ items: filtered });
  } catch (err) {
    console.error("Error listing S3 objects:", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
