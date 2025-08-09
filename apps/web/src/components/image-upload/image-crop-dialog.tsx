"use client";

import { Button } from "@rallly/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@rallly/ui/dialog";
import React from "react";
import type { Crop, PixelCrop } from "react-image-crop";
import ReactCrop, { centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { Trans } from "@/components/trans";
import { useTranslation } from "@/i18n/client";
import { getCroppedImg } from "@/lib/image-processing";

export interface ImageCropDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Image URL to crop */
  imageSrc: string | null;
  /** Original file being cropped */
  originalFile: File | null;
  /** Loading state during upload */
  isUploading?: boolean;
  /** Callback when dialog should close */
  onClose: () => void;
  /** Callback when crop is complete with the cropped file */
  onCropComplete: (croppedFile: File) => Promise<void>;
}

export function ImageCropDialog({
  open,
  imageSrc,
  originalFile,
  isUploading = false,
  onClose,
  onCropComplete,
}: ImageCropDialogProps) {
  const { t } = useTranslation();
  const [crop, setCrop] = React.useState<Crop>();
  const [completedCrop, setCompletedCrop] = React.useState<PixelCrop>();
  const imgRef = React.useRef<HTMLImageElement>(null);

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    const crop = centerCrop(
      makeAspectCrop(
        {
          unit: "%",
          width: 90,
        },
        1, // 1:1 aspect ratio
        width,
        height,
      ),
      width,
      height,
    );
    setCrop(crop);
  };

  const handleCropComplete = async () => {
    if (!completedCrop || !imgRef.current || !originalFile) return;

    try {
      const croppedFile = await getCroppedImg(
        imgRef.current,
        completedCrop,
        originalFile.name,
        originalFile.type,
      );

      await onCropComplete(croppedFile);
    } catch (error) {
      console.error("Failed to crop image:", error);
      throw error; // Re-throw to let parent handle the error
    }
  };

  // Reset crop state when dialog opens/closes
  React.useEffect(() => {
    if (!open) {
      setCrop(undefined);
      setCompletedCrop(undefined);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-fit">
        <DialogHeader>
          <DialogTitle>
            <Trans i18nKey="imageCropDialogTitle" defaults="Crop Image" />
          </DialogTitle>
        </DialogHeader>

        {imageSrc && (
          <div className="flex justify-center">
            <ReactCrop
              crop={crop}
              onChange={(_, percentCrop) => setCrop(percentCrop)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={1}
              minWidth={100}
              minHeight={100}
              className="max-h-96"
            >
              {/* biome-ignore lint/performance/noImgElement: required for react-image-crop */}
              <img
                ref={imgRef}
                alt={t("cropPreview", {
                  defaultValue: "Crop preview",
                })}
                src={imageSrc}
                onLoad={onImageLoad}
                className="max-h-96 max-w-full"
              />
            </ReactCrop>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="primary"
            className="w-full"
            loading={isUploading}
            onClick={handleCropComplete}
            disabled={!completedCrop}
          >
            <Trans i18nKey="uploadImage" defaults="Crop & Upload" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
