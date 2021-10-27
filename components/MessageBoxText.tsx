import React, { useState, useEffect } from "react";
import { IMessage, decrytMessageFromBuffer } from "../utils/jabber";
import { Text, View, StyleSheet } from "react-native";
import { useWallet } from "../utils/wallet";
import { CachePrefix, asyncCache } from "../utils/cache";

export const MessageBoxText = ({ message }: { message: IMessage }) => {
  const { wallet } = useWallet();
  const [decrypted, setDecrypted] = useState<undefined | string>(undefined);
  const cacheKey = CachePrefix.DecryptedMessage + message.address.toBase58();

  useEffect(() => {
    const fn = async () => {
      const cached = await asyncCache.get(cacheKey);
      if (!cached) {
        const _decrypted = decrytMessageFromBuffer(
          message.message.msg,
          message.address,
          wallet,
          message.message.sender
        ) as string;
        await asyncCache.set(cacheKey, _decrypted);
        setDecrypted(_decrypted);
      } else {
        setDecrypted(cached);
      }
    };
    fn();
  }, []);

  const isUser = wallet?.publicKey.equals(message.message.sender);

  return (
    <View style={isUser ? styles.rootUser : styles.rootContact}>
      <View style={isUser ? styles.messageBoxUser : styles.messageBoxContact}>
        <Text
          style={isUser ? styles.messageTextUser : styles.messageTextContact}
        >
          {decrypted}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  messageTextUser: {
    color: "white",
    textAlign: "right",
  },
  messageTextContact: {
    color: "white",
    textAlign: "left",
  },
  messageBoxContact: {
    backgroundColor: "rgb(52, 52, 52)",
    borderRadius: 5,
    marginTop: 5,
    padding: 10,
    marginLeft: 5,
  },
  messageBoxUser: {
    backgroundColor: "rgb(27, 86, 235)",
    borderRadius: 5,
    marginTop: 5,
    padding: 10,
    marginRight: 5,
  },
  rootUser: {
    display: "flex",
    alignItems: "flex-end",
  },
  rootContact: {
    display: "flex",
    alignItems: "flex-start",
  },
});
