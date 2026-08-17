import { AppError } from "@/lib/errors/app-error";

export async function uploadAsset({
  url,
  file,
}: {
  url: string;
  file: File;
}): Promise<void> {
  const response = await fetch(url, {
    method: "PUT",
    body: file,
    headers: {
      "Content-Type": file.type,
    },
  });

  if (!response.ok) {
    throw new AppError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to upload asset to storage",
    });
  }
}
