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
import { avatarAssetProfile } from "@/features/user/constants";
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

  return (
    <ImageUpload>
      <ImageUploadPreview>
        <OptimizedAvatarImage src={image} name={name} size="xl" />
      </ImageUploadPreview>
      <ImageUploadControl
        profile={avatarAssetProfile}
        signUpload={(input) => getAvatarUploadUrl.executeAsync(input)}
        persistUpload={(imageKey) =>
          updateUserAvatar.executeAsync({ imageKey })
        }
        onRemove={() => removeUserAvatar.executeAsync()}
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
