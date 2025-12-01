"use client";

import { cn } from "@rallly/ui";
import { Alert, AlertDescription } from "@rallly/ui/alert";
import { Button } from "@rallly/ui/button";
import { Icon } from "@rallly/ui/icon";
import { DownloadIcon } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import * as React from "react";
import { Trans } from "@/components/trans";

export interface QRCodeDisplayProps {
  /**
   * The poll invite URL to encode in the QR code
   * @example "https://rallly.co/invite/abc123"
   */
  url: string;

  /**
   * Poll ID used for generating download filename
   * @example "clx123abc"
   */
  pollId: string;

  /**
   * QR code size in pixels
   * @default 512
   */
  size?: number;

  /**
   * Error correction level
   * L = Low (7%), M = Medium (15%), Q = Quartile (25%), H = High (30%)
   * @default "M"
   */
  level?: "L" | "M" | "Q" | "H";

  /**
   * Additional CSS classes
   */
  className?: string;
}

export function QRCodeDisplay({
  url,
  pollId,
  size = 512,
  level = "M",
  className,
}: QRCodeDisplayProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [isDownloading, setIsDownloading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleDownload = async () => {
    setIsDownloading(true);
    setError(null);

    try {
      const canvas = canvasRef.current;
      if (!canvas) {
        throw new Error("Canvas not found");
      }

      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((b) => resolve(b), "image/png", 1.0);
      });

      if (!blob) {
        throw new Error("Failed to generate PNG");
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = `rallly-poll-${pollId}-qr.png`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div className="flex justify-center rounded-lg border bg-white p-4">
        <QRCodeCanvas
          ref={canvasRef}
          value={url}
          size={size}
          level={level}
          bgColor="#FFFFFF"
          fgColor="#000000"
          marginSize={4}
          aria-label="QR code for poll invitation"
        />
      </div>

      <Button
        onClick={handleDownload}
        disabled={isDownloading}
        className="w-full"
      >
        <Icon>
          <DownloadIcon />
        </Icon>
        <Trans i18nKey="downloadQrCode" defaults="Download QR Code" />
      </Button>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>
            <Trans
              i18nKey="qrCodeError"
              defaults="Failed to generate QR code. Please try again."
            />
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
