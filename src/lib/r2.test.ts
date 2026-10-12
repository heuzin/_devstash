import { describe, expect, it } from "vitest";
import { R2_PUBLIC_URL, buildObjectKey, keyFromFileUrl } from "./r2";

describe("keyFromFileUrl", () => {
  it("strips the public URL prefix to recover the object key", () => {
    const key = keyFromFileUrl(`${R2_PUBLIC_URL}/user_123/abc-doc.pdf`);
    expect(key).toBe("user_123/abc-doc.pdf");
  });

  it("returns null for a URL that doesn't match our R2 public URL", () => {
    expect(keyFromFileUrl("https://evil.example.com/malware.pdf")).toBeNull();
  });

  it("returns null when the URL has no path after the public URL", () => {
    expect(keyFromFileUrl(`${R2_PUBLIC_URL}`)).toBeNull();
  });
});

describe("buildObjectKey", () => {
  it("prefixes the key with the user id", () => {
    const key = buildObjectKey("user_123", "photo.png");
    expect(key.startsWith("user_123/")).toBe(true);
  });

  it("keeps a safe file name intact", () => {
    const key = buildObjectKey("user_123", "photo.png");
    expect(key).toMatch(/^user_123\/[0-9a-f-]{36}-photo\.png$/);
  });

  it("replaces spaces and other unsafe characters with underscores", () => {
    const key = buildObjectKey("user_123", "my file.png");
    expect(key).toMatch(/^user_123\/[0-9a-f-]{36}-my_file\.png$/);
  });

  it("strips slashes so a crafted file name can't add extra path segments", () => {
    const key = buildObjectKey("user_123", "../other_user/secret.txt");
    expect(key).toMatch(/^user_123\/[0-9a-f-]{36}-\.\._other_user_secret\.txt$/);
    expect(key.split("/")).toHaveLength(2);
  });

  it("produces a unique key for the same file name on repeated calls", () => {
    const key1 = buildObjectKey("user_123", "same.txt");
    const key2 = buildObjectKey("user_123", "same.txt");
    expect(key1).not.toBe(key2);
  });
});
