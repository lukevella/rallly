import * as React from "react";
import { useList } from "react-use";

import { useRequiredContext } from "../use-required-context";
import Modal, { ModalProps } from "./modal";

export interface ModalProviderProps {
  children?: React.ReactNode;
}

type ModalContentProps = { close: () => void };

interface ModalConfig extends Omit<ModalProps, "content"> {
  content?: React.ReactNode | ((props: ModalContentProps) => React.ReactNode);
}

const ModalContext = React.createContext<{
  render: (el: ModalConfig) => void;
  add: (id: string, el: React.ReactNode, config?: ModalConfig) => void;
  remove: (id: string) => void;
} | null>(null);

ModalContext.displayName = "<ModalProvider />";

export const useModalContext = () => {
  return useRequiredContext(ModalContext);
};

const ModalProvider: React.FunctionComponent<ModalProviderProps> = ({
  children,
}) => {
  const [modals, { push, removeAt, updateAt }] = useList<ModalConfig>([]);

  const [modalById, setModalById] = React.useState<
    Record<string, { content: React.ReactNode; config?: ModalConfig }>
  >({});

  const removeModalAt = (index: number) => {
    updateAt(index, { ...modals[index], visible: false });
    setTimeout(() => {
      removeAt(index);
    }, 500);
  };

  const remove = (id: string) => {
    const newModalById = { ...modalById };
    delete newModalById[id];
    setModalById(newModalById);
  };

  return (
    <ModalContext.Provider
      value={{
        /**
         * @deprecated
         */
        render: (props) => {
          push(props);
        },
        add: (id: string, content: React.ReactNode, config?: ModalConfig) => {
          setModalById({ ...modalById, [id]: { content, config } });
        },
        remove,
      }}
    >
      {children}
      {Object.entries(modalById).map(([id, modal]) => (
        <Modal
          key={id}
          visible={true}
          {...modal.config}
          content={modal.content}
          footer={null}
          onCancel={() => {
            remove(id);
          }}
        />
      ))}
      {modals.map((props, i) => (
        <Modal
          key={i}
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
