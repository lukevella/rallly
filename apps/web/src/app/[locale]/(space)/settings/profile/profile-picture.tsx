"use client";

import {
  ImageUpload,
  ImageUploadControl,
  ImageUploadPreview,
} from "@/components/image-upload";
import { OptimizedAvatarImage } from "@/components/optimized-avatar-image";
import {
  getAvatarUploadUrlAction,
  removeUserAvatarAction,
  updateUserAvatarAction,
} from "@/features/user/actions";
import { useFeatureFlag } from "@/lib/feature-flags/client";
import { useSafeAction } from "@/lib/safe-action/client";

function ProfilePictureUpload({
  image,
  name,
}: {
  image?: string;
  name: string;
}) {
  const getAvatarUploadUrl = useSafeAction(getAvatarUploadUrlAction);
  const updateUserAvatar = useSafeAction(updateUserAvatarAction);
  const removeUserAvatar = useSafeAction(removeUserAvatarAction);

  const handleUploadSuccess = async (imageKey: string) => {
    await updateUserAvatar.executeAsync({ imageKey });
  };

  const handleRemoveSuccess = async () => {
    await removeUserAvatar.executeAsync();
  };

  return (
    <ImageUpload>
      <ImageUploadPreview>
        <OptimizedAvatarImage src={image} name={name} size="xl" />
      </ImageUploadPreview>
      <ImageUploadControl
        getUploadUrl={async (input) => {
          const result = await getAvatarUploadUrl.executeAsync(input);
          if (!result?.data) {
            throw new Error("Failed to get upload URL");
          }
          return result.data;
        }}
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
