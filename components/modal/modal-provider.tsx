import * as React from "react";
import { useList } from "react-use";
import { useRequiredContext } from "../use-required-context";
import Modal, { ModalProps } from "./modal";

export interface ModalProviderProps {
  children?: React.ReactNode;
}

const ModalContext =
  React.createContext<{
    render: (el: ModalProps) => void;
  } | null>(null);

ModalContext.displayName = "<ModalProvider />";

export const useModalContext = () => {
  return useRequiredContext(ModalContext);
};

const ModalProvider: React.VoidFunctionComponent<ModalProviderProps> = ({
  children,
}) => {
  const [modals, { push, removeAt, updateAt }] = useList<ModalProps>([]);

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
          push(props);
        },
      }}
    >
      {children}
      {modals.map((props, i) => (
        <Modal
          key={i}
          visible={true}
          {...props}
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
