import React from "react";
import { IMessage } from "../utils/jabber";
import { MessageBoxText } from "./MessageBoxText";
import { MessageType } from "@bonfida/jabber";
import { MessageBoxMedia } from "./MessageBoxMedia";

export const RenderMessage = ({ message }: { message: IMessage }) => {
  switch (message?.message?.kind) {
    case MessageType.Encrypted:
      return <MessageBoxText message={message} />;
    case MessageType.EncryptedImage:
      return <MessageBoxMedia message={message} />;
    default:
      return null;
  }
};
