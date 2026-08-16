import * as z from "zod";

export const allowedMimeTypes = z.enum(["image/jpeg", "image/png"]);
export type AllowedMimeType = z.infer<typeof allowedMimeTypes>;

export interface ImageUploadControlProps {
  getUploadUrl: (input: {
    fileType: AllowedMimeType;
    fileSize: number;
  }) => Promise<{ url: string; fields: { key: string } }>;
  onUploadSuccess: (imageKey: string) => Promise<void> | void;
  onRemoveSuccess: () => Promise<void> | void;
  hasCurrentImage?: boolean;
  /**
   * When false, the selected file is uploaded as-is instead of going through
   * the 1:1 crop dialog. Use for images with a free aspect ratio (e.g. logos).
   */
  crop?: boolean;
  disabled?: boolean;
}

export interface ImageUploadPreviewProps {
  className?: string;
  children?: React.ReactNode;
}

export interface ImageUploadProps {
  className?: string;
  children?: React.ReactNode;
}
