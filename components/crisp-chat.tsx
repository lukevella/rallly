import * as React from "react";
import Button from "./button";
import Chat from "@/components/icons/chat.svg";

const crispWebsiteId = process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID;

declare global {
  interface Window {
    $crisp?: Array<unknown>;
    CRISP_WEBSITE_ID?: string;
  }
}

export const showCrispChat = () => {
  window.$crisp?.push(["do", "chat:show"]);
  window.$crisp?.push(["do", "chat:open"]);
};

export const ChatButton: React.VoidFunctionComponent<{ text?: string }> = ({
  text,
}) => {
  return (
    <Button icon={<Chat />} onClick={showCrispChat}>
      {text}
    </Button>
  );
};

const CrispChat: React.VoidFunctionComponent = () => {
  React.useEffect(() => {
    if (!crispWebsiteId) {
      return;
    }
    window.$crisp = [];
    window.CRISP_WEBSITE_ID = crispWebsiteId;
    (() => {
      const d = document;
      const s = d.createElement("script");
      s.src = "https://client.crisp.chat/l.js";
      s.async = true;
      d.getElementsByTagName("body")[0].appendChild(s);
      window.$crisp.push(["safe", true]); // disable warning about other event listeners
      window.$crisp.push(["do", "chat:hide"]);
      window.$crisp.push([
        "on",
        "chat:closed",
        () => {
          window.$crisp?.push(["do", "chat:hide"]);
        },
      ]);
    })();
  });

  return null;
};

export default CrispChat;
