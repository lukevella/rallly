# Component Contract: QRCodeDisplay

**File**: `apps/web/src/components/poll/qr-code-display.tsx`  
**Type**: Client Component ("use client")

## Purpose

Renders a QR code encoding the poll invite URL with download capability for poll owners to share in physical spaces (presentations, printed materials).

## Props Interface

```tsx
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
  level?: 'L' | 'M' | 'Q' | 'H';

  /**
   * Additional CSS classes
   */
  className?: string;
}
```

## Component Structure

```tsx
export function QRCodeDisplay({ 
  url, 
  pollId, 
  size = 512, 
  level = "M",
  className 
}: QRCodeDisplayProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [isDownloading, setIsDownloading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Download handler implementation
  // QRCodeCanvas rendering
  // Error handling
}
```

## Rendering Output

```tsx
<div className={cn("flex flex-col gap-4", className)}>
  {/* QR Code Canvas */}
  <div className="flex justify-center">
    <QRCodeCanvas
      ref={canvasRef}
      value={url}
      size={size}
      level={level}
      bgColor="#FFFFFF"
      fgColor="#000000"
      marginSize={4}
    />
  </div>

  {/* Download Button */}
  <Button onClick={handleDownload} disabled={isDownloading}>
    <Icon>
      <DownloadIcon />
    </Icon>
    <Trans i18nKey="downloadQrCode" defaults="Download QR Code" />
  </Button>

  {/* Error Display */}
  {error && (
    <Alert variant="destructive">
      <Trans i18nKey="qrCodeError" defaults="Failed to generate QR code" />
    </Alert>
  )}
</div>
```

## Behavior

### Download Flow

1. User clicks "Download QR Code" button
2. Get canvas ref from `QRCodeCanvas`
3. Call `canvas.toBlob()` with 'image/png' type
4. Create object URL from blob
5. Create temporary `<a>` element with download attribute
6. Set filename: `rallly-poll-{pollId}-qr.png`
7. Trigger click on `<a>` element
8. Cleanup: revoke object URL

### Error Handling

**Scenarios**:
- Canvas ref is null → Display error, retry available
- `toBlob()` fails → Display error, retry available
- URL is invalid → Display error (should not happen with valid poll)
- URL exceeds 2000 chars → Warning (may affect scannability)

## Dependencies

```tsx
import { QRCodeCanvas } from "qrcode.react";
import { Button } from "@rallly/ui/button";
import { Icon } from "@rallly/ui/icon";
import { Alert } from "@rallly/ui/alert";
import { DownloadIcon } from "lucide-react";
import { Trans } from "@/components/trans";
import { cn } from "@rallly/ui";
```

## Usage Example

```tsx
import { QRCodeDisplay } from "@/components/poll/qr-code-display";
import { usePoll } from "@/contexts/poll";

function InviteDialog() {
  const poll = usePoll();
  const inviteUrl = `${window.location.origin}/invite/${poll.id}`;

  return (
    <Dialog>
      <DialogContent>
        <QRCodeDisplay url={inviteUrl} pollId={poll.id} />
      </DialogContent>
    </Dialog>
  );
}
```

## Accessibility

- **aria-label**: "QR code for poll invitation"
- **Button**: Descriptive text with icon
- **Error messages**: Clear, actionable feedback
- **Keyboard**: Download button is keyboard accessible

## i18n Keys

```json
{
  "downloadQrCode": "Download QR Code",
  "qrCodeError": "Failed to generate QR code. Please try again.",
  "qrCodeAriaLabel": "QR code for poll invitation"
}
```

## Testing

### Unit Tests

```tsx
describe('QRCodeDisplay', () => {
  it('renders QR code with correct URL', () => {
    render(<QRCodeDisplay url="https://example.com" pollId="test" />);
    // Assert canvas is rendered with correct props
  });

  it('downloads PNG when button clicked', async () => {
    const { getByText } = render(<QRCodeDisplay url="https://example.com" pollId="test" />);
    const downloadButton = getByText('Download QR Code');
    
    // Mock canvas.toBlob
    // Click button
    // Assert blob creation and download triggered
  });

  it('displays error when download fails', async () => {
    // Mock canvas.toBlob to fail
    // Trigger download
    // Assert error message displayed
  });
});
```

### Integration Tests

```tsx
test('poll owner can download QR code', async ({ page }) => {
  // Navigate to poll admin page
  // Open invite dialog
  // Verify QR code is visible
  // Click download button
  // Verify PNG file is downloaded with correct filename
});
```

## Performance

- **Initial render**: <100ms (QR generation is fast)
- **Download**: <1s for 512x512px PNG
- **Memory**: Canvas is cleaned up after download (blob URL revoked)

## Future Enhancements

- [ ] SVG export option (in addition to PNG)
- [ ] Size selector (Small/Medium/Large)
- [ ] Custom colors (brand colors instead of black/white)
- [ ] Copy image to clipboard
- [ ] Print preview

