import { Dialog } from "@headlessui/react";
import { XIcon } from "@rallly/icons";
import { AnimatePresence, m } from "framer-motion";
import * as React from "react";

import { ButtonProps, LegacyButton } from "../button";

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
  showClose?: boolean;
}

const Modal: React.FunctionComponent<ModalProps> = ({
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
  showClose,
}) => {
  const initialFocusRef = React.useRef<HTMLButtonElement>(null);
  return (
    <AnimatePresence>
      {visible ? (
        <Dialog
          open={visible}
          className="fixed inset-0 z-50 overflow-y-auto"
          initialFocus={initialFocusRef}
          onClose={() => {
            if (overlayClosable) onCancel?.();
          }}
        >
          <m.div
            transition={{ duration: 0.5 }}
            className="flex min-h-screen items-center justify-center"
          >
            <Dialog.Overlay
              as={m.div}
              transition={{ duration: 0.5 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-0 bg-gray-900/25"
            />
            <m.div
              transition={{ duration: 0.1 }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative z-50 m-3 inline-block max-w-full transform text-left align-middle sm:m-8"
            >
              <div
                data-testid="modal"
                className="shadow-huge max-w-full overflow-hidden rounded-md bg-white"
              >
                {showClose ? (
                  <button
                    role="button"
                    className="absolute right-2 top-2 z-10 inline-flex h-7 w-7 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-500/10 hover:text-gray-500 focus:ring-0 focus:ring-offset-0 active:bg-gray-500/20"
                    onClick={onCancel}
                  >
                    <XIcon className="h-4" />
                  </button>
                ) : null}
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
                  <div className="flex h-14 items-center justify-end gap-3 rounded-br-lg border-t bg-gray-50 p-3">
                    {cancelText ? (
                      <LegacyButton
                        onClick={() => {
                          onCancel?.();
                        }}
                      >
                        {cancelText}
                      </LegacyButton>
                    ) : null}
                    {okText ? (
                      <LegacyButton
                        ref={initialFocusRef}
                        type="primary"
                        onClick={() => {
                          onOk?.();
                        }}
                        {...okButtonProps}
                      >
                        {okText}
                      </LegacyButton>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </m.div>
          </m.div>
        </Dialog>
      ) : null}
    </AnimatePresence>
  );
};

export default Modal;
