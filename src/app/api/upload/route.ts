import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { buildObjectKey, deleteFromR2, keyFromFileUrl, uploadToR2 } from "@/lib/r2";
import { UPLOAD_CONSTRAINTS, validateUpload, type UploadKind } from "@/lib/upload-constraints";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const kind = formData.get("kind");

  if (!(file instanceof File) || typeof kind !== "string" || !(kind in UPLOAD_CONSTRAINTS)) {
    return NextResponse.json({ success: false, error: "Invalid upload" }, { status: 400 });
  }

  const validation = validateUpload(kind as UploadKind, file.name, file.size, file.type);
  if (!validation.valid) {
    return NextResponse.json({ success: false, error: validation.error }, { status: 400 });
  }

  const key = buildObjectKey(session.user.id, file.name);
  const buffer = Buffer.from(await file.arrayBuffer());
  const fileUrl = await uploadToR2(key, buffer, validation.contentType ?? "application/octet-stream");

  return NextResponse.json({
    success: true,
    data: { fileUrl, fileName: file.name, fileSize: file.size },
  });
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { fileUrl } = await request.json();
  if (typeof fileUrl !== "string") {
    return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 });
  }

  const key = keyFromFileUrl(fileUrl);
  if (!key || !key.startsWith(`${session.user.id}/`)) {
    return NextResponse.json({ success: false, error: "Invalid file" }, { status: 400 });
  }

  await deleteFromR2(key);
  return NextResponse.json({ success: true });
}
