import * as React from "react";
import { useList } from "react-use";

import { useRequiredContext } from "../use-required-context";
import Modal, { ModalProps } from "./modal";

export interface ModalProviderProps {
  children?: React.ReactNode;
}

type ModalContentProps = { close: () => void };

interface ModalConfig extends ModalProps {
  content?: React.ReactNode | ((props: ModalContentProps) => React.ReactNode);
}

const ModalContext =
  React.createContext<{
    render: (el: ModalConfig) => void;
  } | null>(null);

ModalContext.displayName = "<ModalProvider />";

export const useModalContext = () => {
  return useRequiredContext(ModalContext);
};

const ModalProvider: React.VoidFunctionComponent<ModalProviderProps> = ({
  children,
}) => {
  const counter = React.useRef(0);

  const [modals, { push, removeAt, updateAt }] = useList<
    ModalConfig & { id: number }
  >([]);

  const removeModalAt = (index: number) => {
    updateAt(index, { ...modals[index], visible: false });
    setTimeout(() => {
      removeAt(index);
    }, 500);
  };
  return (
    <ModalContext.Provider
      value={{
        render: (props) => {
          push({ ...props, id: counter.current++ });
        },
      }}
    >
      {children}
      {modals.map((props, i) => (
        <Modal
          key={`modal-${props.id}`}
          visible={true}
          {...props}
          content={
            typeof props.content === "function"
              ? props.content({ close: () => removeModalAt(i) })
              : props.content
          }
          onOk={() => {
            props.onOk?.();
            removeModalAt(i);
          }}
          onCancel={() => {
            props.onCancel?.();
            removeModalAt(i);
          }}
        />
      ))}
    </ModalContext.Provider>
  );
};

export default ModalProvider;
