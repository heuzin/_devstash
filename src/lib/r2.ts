import { randomUUID } from "crypto";
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID!;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID!;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY!;
export const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME!;
export const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL!;

export const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
}

export function buildObjectKey(userId: string, fileName: string) {
  return `${userId}/${randomUUID()}-${sanitizeFileName(fileName)}`;
}

export function keyFromFileUrl(fileUrl: string): string | null {
  const prefix = `${R2_PUBLIC_URL}/`;
  if (!fileUrl.startsWith(prefix)) return null;
  return fileUrl.slice(prefix.length);
}

export async function uploadToR2(key: string, body: Buffer, contentType: string) {
  await r2Client.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
  return `${R2_PUBLIC_URL}/${key}`;
}

export async function deleteFromR2(key: string) {
  await r2Client.send(new DeleteObjectCommand({ Bucket: R2_BUCKET_NAME, Key: key }));
}

export async function getFromR2(key: string) {
  return r2Client.send(new GetObjectCommand({ Bucket: R2_BUCKET_NAME, Key: key }));
}
