import { Dialog } from "@headlessui/react";
import { AnimatePresence, motion } from "framer-motion";
import * as React from "react";

import Button, { ButtonProps } from "../button";

export interface ModalProps {
  description?: React.ReactNode;
  title?: React.ReactNode;
  okText?: string;
  cancelText?: string;
  okButtonProps?: ButtonProps;
  onOk?: () => void;
  onCancel?: () => void;
  footer?: React.ReactNode;
  content?: React.ReactNode;
  overlayClosable?: boolean;
  visible?: boolean;
}

const Modal: React.VoidFunctionComponent<ModalProps> = ({
  description,
  title,
  okText,
  cancelText,
  okButtonProps,
  footer,
  content,
  overlayClosable,
  onCancel,
  onOk,
  visible,
}) => {
  const initialFocusRef = React.useRef<HTMLDivElement>(null);
  return (
    <AnimatePresence>
      {visible ? (
        <Dialog
          open={visible}
          className="fixed inset-0 z-40 overflow-y-auto"
          initialFocus={initialFocusRef}
          onClose={() => {
            if (overlayClosable) onCancel?.();
          }}
        >
          <motion.div
            transition={{ duration: 0.5 }}
            className="flex min-h-screen items-center justify-center"
          >
            <Dialog.Overlay
              as={motion.div}
              transition={{ duration: 0.5 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-0 bg-slate-900 bg-opacity-10"
            />
            <motion.div
              transition={{ duration: 0.1 }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              ref={initialFocusRef}
              className="z-50 my-8 mx-4 inline-block w-fit transform rounded-xl bg-white text-left align-middle shadow-xl transition-all"
            >
              {content ?? (
                <div className="max-w-md p-6">
                  {title ? (
                    <Dialog.Title className="mb-2 font-medium">
                      {title}
                    </Dialog.Title>
                  ) : null}
                  {description ? (
                    <Dialog.Description className="m-0">
                      {description}
                    </Dialog.Description>
                  ) : null}
                </div>
              )}
              {footer === undefined ? (
                <div className="flex h-14 items-center justify-end space-x-3 rounded-br-lg rounded-bl-lg border-t bg-slate-50 px-4">
                  {cancelText ? (
                    <Button
                      onClick={() => {
                        onCancel?.();
                      }}
                    >
                      {cancelText}
                    </Button>
                  ) : null}
                  {okText ? (
                    <Button
                      type="primary"
                      onClick={() => {
                        onOk?.();
                      }}
                      {...okButtonProps}
                    >
                      {okText}
                    </Button>
                  ) : null}
                </div>
              ) : null}
            </motion.div>
          </motion.div>
        </Dialog>
      ) : null}
    </AnimatePresence>
  );
};

export default Modal;
