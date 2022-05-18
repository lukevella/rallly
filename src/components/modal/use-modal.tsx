import React from "react";

import Modal, { ModalProps } from "./modal";

type OpenModalFn = () => void;
type CloseModalFn = () => void;

export const useModal = (
  props?: ModalProps,
): [React.ReactElement<ModalProps>, OpenModalFn, CloseModalFn] => {
  const [visible, setVisible] = React.useState(false);
  const modal = (
    <Modal
      {...props}
      visible={visible}
      onOk={() => {
        props?.onOk?.();
        setVisible(false);
      }}
      onCancel={() => {
        props?.onCancel?.();
        setVisible(false);
      }}
    />
  );
  return [modal, () => setVisible(true), () => setVisible(false)];
};
