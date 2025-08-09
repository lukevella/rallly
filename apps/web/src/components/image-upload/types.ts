import { z } from "zod";

export const allowedMimeTypes = z.enum(["image/jpeg", "image/png"]);
export type AllowedMimeType = z.infer<typeof allowedMimeTypes>;

export interface ImageUploadControlProps {
  keyPrefix: "avatars" | "spaces";
  onUploadSuccess: (imageKey: string) => Promise<void> | void;
  onRemoveSuccess: () => Promise<void> | void;
  hasCurrentImage?: boolean;
}

export interface ImageUploadPreviewProps {
  className?: string;
  children?: React.ReactNode;
}

export interface ImageUploadProps {
  className?: string;
  children?: React.ReactNode;
}
