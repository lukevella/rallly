"use client";

import { usePostHog } from "@rallly/posthog/client";
import { useRouter } from "next/navigation";
import {
  ImageUpload,
  ImageUploadControl,
  ImageUploadPreview,
} from "@/components/image-upload";
import { OptimizedAvatarImage } from "@/components/optimized-avatar-image";
import { useFeatureFlag } from "@/lib/feature-flags/client";
import { trpc } from "@/trpc/client";

function ProfilePictureUpload({
  image,
  name,
}: {
  image?: string;
  name: string;
}) {
  const router = useRouter();
  const posthog = usePostHog();

  const updateAvatar = trpc.user.updateAvatar.useMutation();
  const removeAvatar = trpc.user.removeAvatar.useMutation();

  const handleUploadSuccess = async (imageKey: string) => {
    await updateAvatar.mutateAsync({ imageKey });
    router.refresh();
    posthog?.capture("upload profile picture");
  };

  const handleRemoveSuccess = async () => {
    await removeAvatar.mutateAsync();
    router.refresh();
    posthog?.capture("remove profile picture");
  };

  return (
    <ImageUpload>
      <ImageUploadPreview>
        <OptimizedAvatarImage src={image} name={name} size="xl" />
      </ImageUploadPreview>
      <ImageUploadControl
        keyPrefix="avatars"
        onUploadSuccess={handleUploadSuccess}
        onRemoveSuccess={handleRemoveSuccess}
        hasCurrentImage={!!image}
      />
    </ImageUpload>
  );
}

export function ProfilePicture({
  name,
  image,
}: {
  name: string;
  image?: string;
}) {
  const isStorageEnabled = useFeatureFlag("storage");

  if (isStorageEnabled) {
    return <ProfilePictureUpload image={image} name={name} />;
  }

  return <OptimizedAvatarImage src={image} name={name} size="lg" />;
}
