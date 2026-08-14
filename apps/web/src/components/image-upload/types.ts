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
   * Fixed crop aspect ratio. Leave undefined to allow a free-form crop, for
   * example a wide logo.
   */
  aspect?: number;
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
