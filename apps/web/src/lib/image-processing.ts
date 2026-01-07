import type { PercentCrop } from "react-image-crop";

// Configuration for image optimization
export const IMAGE_OPTIMIZATION = {
  // Maximum dimensions for the output image
  MAX_WIDTH: 800,
  MAX_HEIGHT: 800,
  // JPEG quality (0.1 to 1.0, higher = better quality but larger size)
  JPEG_QUALITY: 0.85,
  // PNG quality (0.1 to 1.0)
  PNG_QUALITY: 0.9,
} as const;

/**
 * Converts a cropped image to an optimized file with compression and format selection
 * @param image - The source image element
 * @param crop - The crop coordinates in percentage (0-100)
 * @param fileName - Original filename
 * @param fileType - Original file MIME type
 * @returns Promise resolving to optimized File
 */
export function getCroppedImg(
  image: HTMLImageElement,
  crop: PercentCrop,
  fileName: string,
  fileType: string,
): Promise<File> {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("No 2d context");
  }

  // Convert percent crop to pixel values based on displayed image dimensions
  const cropX = (crop.x / 100) * image.width;
  const cropY = (crop.y / 100) * image.height;
  const cropWidth = (crop.width / 100) * image.width;
  const cropHeight = (crop.height / 100) * image.height;

  // Scale to natural image dimensions
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;

  // Calculate the actual crop dimensions in natural image coordinates
  // Round to integers to avoid sub-pixel rendering artifacts
  const naturalCropX = Math.round(cropX * scaleX);
  const naturalCropY = Math.round(cropY * scaleY);
  const naturalCropWidth = Math.round(cropWidth * scaleX);
  const naturalCropHeight = Math.round(cropHeight * scaleY);

  // Calculate optimized dimensions while maintaining aspect ratio
  const aspectRatio = naturalCropWidth / naturalCropHeight;
  let outputWidth = naturalCropWidth;
  let outputHeight = naturalCropHeight;

  // Resize if the image is larger than our maximum dimensions
  if (
    outputWidth > IMAGE_OPTIMIZATION.MAX_WIDTH ||
    outputHeight > IMAGE_OPTIMIZATION.MAX_HEIGHT
  ) {
    if (aspectRatio > 1) {
      // Width is the constraining dimension
      outputWidth = Math.min(IMAGE_OPTIMIZATION.MAX_WIDTH, outputWidth);
      outputHeight = Math.round(outputWidth / aspectRatio);
    } else {
      // Height is the constraining dimension
      outputHeight = Math.min(IMAGE_OPTIMIZATION.MAX_HEIGHT, outputHeight);
      outputWidth = Math.round(outputHeight * aspectRatio);
    }
  }

  // Set canvas dimensions to the optimized size
  canvas.width = outputWidth;
  canvas.height = outputHeight;

  // Enable high-quality image scaling
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  // Draw the cropped and resized image
  ctx.drawImage(
    image,
    naturalCropX,
    naturalCropY,
    naturalCropWidth,
    naturalCropHeight,
    0,
    0,
    outputWidth,
    outputHeight,
  );

  return new Promise((resolve, reject) => {
    // Function to create file with given type and quality
    const createFile = (mimeType: string, quality: number, suffix = "") => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Canvas is empty"));
            return;
          }
          const newFileName = `${fileName.replace(/\.[^/.]+$/, "")}${suffix}.${mimeType.split("/")[1]}`;
          const file = new File([blob], newFileName, {
            type: mimeType,
            lastModified: Date.now(),
          });
          resolve(file);
        },
        mimeType,
        quality,
      );
    };

    if (fileType === "image/png") {
      // Keep PNG files as PNG to preserve transparency
      createFile("image/png", IMAGE_OPTIMIZATION.PNG_QUALITY);
    } else {
      // For other formats, default to JPEG
      createFile("image/jpeg", IMAGE_OPTIMIZATION.JPEG_QUALITY, "_optimized");
    }
  });
}

/**
 * Creates an object URL from a File and provides cleanup functionality
 * @param file - The file to create URL for
 * @returns Object with URL and cleanup function
 */
export function createImagePreviewUrl(file: File) {
  const url = URL.createObjectURL(file);
  const cleanup = () => URL.revokeObjectURL(url);
  return { url, cleanup };
}

export type ImageValidationErrorCode = "invalidFileType" | "fileTooLarge";

export interface ImageValidationSuccess {
  success: true;
}

export interface ImageValidationError {
  success: false;
  error: ImageValidationErrorCode;
  description: string;
}

export type ImageValidationResult =
  | ImageValidationSuccess
  | ImageValidationError;

/**
 * Validates if a file is an allowed image type
 * @param file - File to validate
 * @returns Object with success boolean and optional error message
 */
export function validateImageFile(file: File): ImageValidationResult {
  const allowedMimeTypes = ["image/jpeg", "image/png"];

  if (!allowedMimeTypes.includes(file.type)) {
    return {
      success: false,
      error: "invalidFileType",
      description: "Please upload a JPG or PNG file.",
    };
  }

  if (file.size > 2 * 1024 * 1024) {
    return {
      success: false,
      error: "fileTooLarge",
      description: "Please upload a file smaller than 2MB.",
    };
  }

  return { success: true };
}
