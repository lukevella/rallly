import { Dialog, Transition } from "@headlessui/react";
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
  const initialFocusRef = React.useRef<HTMLButtonElement>(null);
  return (
    <Transition appear={true} as={React.Fragment} show={visible}>
      <Dialog
        open={visible}
        className="fixed inset-0 z-40 overflow-y-auto"
        initialFocus={initialFocusRef}
        onClose={() => {
          if (overlayClosable) onCancel?.();
        }}
      >
        <div className="flex min-h-screen items-center justify-center">
          <Transition.Child
            as={React.Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Dialog.Overlay className="fixed inset-0 bg-slate-900 bg-opacity-10" />
          </Transition.Child>
          <Transition.Child
            as={React.Fragment}
            enter="ease-out duration-100"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-100"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <div
              className="my-8 mx-4 inline-block w-fit transform overflow-hidden rounded-xl bg-white text-left align-middle shadow-xl transition-all"
              onMouseDown={(e) => {
                e.stopPropagation();
              }}
            >
              {content ?? (
                <div className="max-w-lg p-4">
                  {title ? <Dialog.Title>{title}</Dialog.Title> : null}
                  {description ? (
                    <Dialog.Description>{description}</Dialog.Description>
                  ) : null}
                </div>
              )}
              {footer ?? (
                <div className="flex h-14 items-center justify-end space-x-3 border-t bg-slate-50 px-4">
                  {cancelText ? (
                    <Button
                      ref={initialFocusRef}
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
              )}
            </div>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
};

export default Modal;
