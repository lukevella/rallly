import "server-only";
import crypto from "node:crypto";
import { DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { after } from "next/server";
import { env } from "@/env";
import { isSelfHosted } from "@/lib/constants";
import { AppError } from "@/lib/errors/app-error";
import type { AssetProfile } from "./asset-profile";
import { extensionByMimeType, parseAssetKey } from "./asset-profile";
import { isStorageKey } from "./resolve-storage-url";
import { getS3Client } from "./s3";

const UPLOAD_TOKEN_TTL_SECONDS = 3600;

function computeSignature(payload: string) {
  return crypto
    .createHmac("sha256", env.SECRET_PASSWORD)
    .update(payload)
    .digest("hex");
}

export function signUploadKey(key: string) {
  const expiry = Math.floor(Date.now() / 1000) + UPLOAD_TOKEN_TTL_SECONDS;
  const signature = computeSignature(`${key}:${expiry}`);
  return `${expiry}.${signature}`;
}

export function verifyUploadToken(key: string, token: string) {
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [expiryStr, signature] = parts;
  const expiry = Number(expiryStr);
  if (!Number.isInteger(expiry)) return false;
  if (expiry <= Math.floor(Date.now() / 1000)) return false;

  const expected = computeSignature(`${key}:${expiry}`);
  const expectedBuf = Buffer.from(expected, "hex");
  const tokenBuf = Buffer.from(signature, "hex");
  if (expectedBuf.length === 0 || expectedBuf.length !== tokenBuf.length) {
    return false;
  }
  return crypto.timingSafeEqual(expectedBuf, tokenBuf);
}

export async function createAssetUploadUrl({
  profile,
  entityId,
  fileType,
  fileSize,
}: {
  profile: AssetProfile;
  entityId: string;
  fileType: string;
  fileSize: number;
}) {
  const s3Client = getS3Client();

  if (!s3Client) {
    throw new AppError({
      code: "INTERNAL_SERVER_ERROR",
      message: "S3 storage has not been configured",
    });
  }

  if (profile.entityIds && !profile.entityIds.includes(entityId)) {
    throw new AppError({
      code: "FORBIDDEN",
      message: `Invalid entity id for asset profile ${profile.id}`,
    });
  }

  if (!profile.accept.includes(fileType)) {
    throw new AppError({
      code: "FORBIDDEN",
      message: `File type ${fileType} is not accepted for asset profile ${profile.id}`,
    });
  }

  if (fileSize > profile.maxSize) {
    throw new AppError({
      code: "PAYLOAD_TOO_LARGE",
      message: "File size too large",
    });
  }

  const key = `${profile.keyPrefix}/${entityId}-${Date.now()}.${extensionByMimeType[fileType]}`;

  if (isSelfHosted) {
    const token = signUploadKey(key);
    return {
      url: `/api/storage/upload/${key}?token=${token}`,
      key,
    };
  }

  const command = new PutObjectCommand({
    Bucket: env.S3_BUCKET_NAME,
    Key: key,
    ContentType: fileType,
    ContentLength: fileSize,
  });

  const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

  return { url, key };
}

/**
 * Verifies that a client-submitted key is one this profile could have signed
 * for this entity. Persist actions call this instead of ad-hoc string checks.
 */
export function assertAssetKey(
  key: string,
  expected: { profile: AssetProfile; entityId: string },
) {
  const parsed = parseAssetKey(key, [expected.profile]);

  if (!parsed || parsed.entityId !== expected.entityId) {
    throw new AppError({
      code: "FORBIDDEN",
      message: "Invalid asset key",
    });
  }
}

/**
 * Deletes an object we own. External values (OAuth avatar URLs, data URIs)
 * are not ours to delete and are ignored.
 */
export async function deleteStoredAsset(key: string) {
  if (!isStorageKey(key)) {
    return;
  }

  const s3Client = getS3Client();

  await s3Client?.send(
    new DeleteObjectCommand({
      Bucket: env.S3_BUCKET_NAME,
      Key: key,
    }),
  );
}

/**
 * The replace-an-asset lifecycle: persist the new value, then delete the old
 * object after the response. Guards live here, once: a retry can resubmit
 * the key that is already stored (equality check), and the old value may be
 * externally hosted media (isStorageKey via deleteStoredAsset).
 *
 * Semantics are last-write-wins: currentKey is read before persist, so a
 * delayed duplicate of an older persist that lands after a newer one can
 * delete an object the concurrent write just made current. Closing that
 * window needs sign-time asset records (the planned Asset table), which is
 * where confirm-before-delete will live.
 */
export async function replaceStoredAsset({
  currentKey,
  nextKey,
  persist,
}: {
  currentKey: string | null | undefined;
  nextKey: string | null;
  persist: () => Promise<void>;
}) {
  await persist();

  if (currentKey && currentKey !== nextKey) {
    after(() => deleteStoredAsset(currentKey));
  }
}
