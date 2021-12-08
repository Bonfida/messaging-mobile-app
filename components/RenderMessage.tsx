import React from "react";
import { IMessage } from "../utils/jabber";
import { MessageBoxText } from "./MessageBoxText";
import { MessageType } from "@bonfida/jabber";
import { MessageBoxMedia } from "./MessageBoxMedia";

export const RenderMessage = ({
  message,
  groupKey,
}: {
  message: IMessage;
  groupKey?: string;
}) => {
  switch (message?.message?.kind) {
    case MessageType.Encrypted:
      return <MessageBoxText message={message} />;
    case MessageType.EncryptedImage:
      return <MessageBoxMedia message={message} />;
    case MessageType.Unencrypted:
      return (
        <MessageBoxText
          message={message}
          encrypted={false}
          groupKey={groupKey}
        />
      );
    case MessageType.UnencryptedImage:
      return <MessageBoxMedia message={message} encrypted={false} />;
    default:
      return null;
  }
};
