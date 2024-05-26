import { Button, ButtonProps } from "@rallly/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@rallly/ui/dialog";
import * as React from "react";

export interface ModalProps {
  title?: React.ReactNode;
  okText?: string;
  cancelText?: string;
  okButtonProps?: ButtonProps;
  onOk?: () => void;
  onCancel?: () => void;
  content?: React.ReactNode;
  overlayClosable?: boolean;
  visible?: boolean;
}

const Modal: React.FunctionComponent<ModalProps> = ({
  title,
  okText,
  content,
  onCancel,
  cancelText,
  onOk,
  okButtonProps,
  visible,
}) => {
  return (
    <Dialog
      open={visible}
      onOpenChange={(open) => {
        if (!open) {
          onCancel?.();
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <p className="text-sm">{content}</p>
        <DialogFooter>
          <DialogClose>
            <Button>{cancelText}</Button>
          </DialogClose>
          <Button
            variant="primary"
            onClick={() => {
              onOk?.();
            }}
            {...okButtonProps}
          >
            {okText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default Modal;
