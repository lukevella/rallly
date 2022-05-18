import ReactDOM from "react-dom";

import Modal, { ModalProps } from "./modal/modal";

export const confirmPrompt = (props: ModalProps) => {
  const div = document.createElement("div");
  document.body.appendChild(div);
  ReactDOM.render(
    <Modal
      okText="Ok"
      cancelText="Cancel"
      {...props}
      visible={true}
      onOk={() => {
        props.onOk?.();
        document.body.removeChild(div);
      }}
      onCancel={() => {
        document.body.removeChild(div);
      }}
    />,
    div,
  );
};
