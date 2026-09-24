"use client";

import { mutationOptions } from "@next-safe-action/adapter-tanstack-query";
import { useMutation } from "@tanstack/react-query";
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

function ProfilePictureUpload({
  image,
  name,
}: {
  image?: string;
  name: string;
}) {
  const getAvatarUploadUrl = useMutation(
    mutationOptions(getAvatarUploadUrlAction),
  );
  const updateUserAvatar = useMutation(mutationOptions(updateUserAvatarAction));
  const removeUserAvatar = useMutation(mutationOptions(removeUserAvatarAction));

  return (
    <ImageUpload>
      <ImageUploadPreview>
        <OptimizedAvatarImage src={image} name={name} size="xl" />
      </ImageUploadPreview>
      <ImageUploadControl
        profile={avatarAssetProfile}
        crop
        signUpload={(input) => getAvatarUploadUrl.mutateAsync(input)}
        persistUpload={(imageKey) => updateUserAvatar.mutateAsync({ imageKey })}
        // The global handler reports the failure; a rejection here would
        // escape the remove transition.
        onRemove={() => removeUserAvatar.mutateAsync().catch(() => {})}
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
