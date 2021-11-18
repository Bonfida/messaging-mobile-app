import React, { useState, useEffect, useRef } from "react";
import {
  IMessage,
  decrytMessageFromBuffer,
  useGroupData,
} from "../utils/jabber";
import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ActivityIndicator,
} from "react-native";
import { useWallet } from "../utils/wallet";
import { CachePrefix, asyncCache } from "../utils/cache";
import { useDisplayName } from "../utils/name-service";
import { formatDisplayName, sleep } from "../utils/utils.native";
import { hashCode } from "../utils/cache";
import { useNavigation } from "@react-navigation/native";
import { profileScreenProp } from "../types";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { deleteGroupMessage, deleteMessage } from "@bonfida/jabber";
import { PublicKey, TransactionInstruction } from "@solana/web3.js";
import { sendTransaction } from "../utils/send";
import { useConnection } from "../utils/connection";

const COLORS = [
  "#FAA357", // orange
  "#61D2FF", // blue/green
  "#85DE85", // light green
  "#ff5694", // pink
  "#71bafa", // blue
];

const contactColor = (name: string | undefined) => {
  if (!name) return "white";
  const hashed = Math.abs(parseFloat(hashCode(name)));
  return COLORS[hashed % 5];
};

export const MessageBoxText = ({
  message,
  encrypted = true,
  showSender,
  groupKey,
}: {
  message: IMessage;
  encrypted?: boolean;
  showSender?: boolean;
  groupKey?: string;
}) => {
  const connection = useConnection();
  const { wallet } = useWallet();
  const [decrypted, setDecrypted] = useState<undefined | string>(undefined);
  const cacheKey = CachePrefix.DecryptedMessage + message.address.toBase58();
  const mountedRef = useRef(true);
  const [displayName] = useDisplayName(message.message.sender.toBase58());
  const groupData = useGroupData(groupKey);
  const navigation = useNavigation<profileScreenProp>();
  const [showDelete, setShowDelete] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fn = async () => {
      if (!mountedRef.current) return;
      const cached = await asyncCache.get<string>(cacheKey);
      if (!cached) {
        const _decrypted = encrypted
          ? (decrytMessageFromBuffer(
              message.message.msg,
              message.address,
              wallet,
              message.message.sender
            ) as string)
          : Buffer.from(message.message.msg).toString();

        await asyncCache.set(cacheKey, _decrypted);
        if (!mountedRef.current) return null;
        setDecrypted(_decrypted);
      } else {
        if (!mountedRef.current) return null;
        setDecrypted(cached);
      }
    };
    fn();
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const isUser = wallet?.publicKey.equals(message.message.sender);
  const isAdmin = !!groupData?.admins.find((a) =>
    a.equals(message.message.sender)
  );

  const isGroup = !!groupKey;

  const handleOnLongPressDelete = () => {
    if (!isUser && !isAdmin) return;
    setShowDelete(true);
  };

  const handleOnPressDelete = async () => {
    if (!wallet) return;
    try {
      setLoading(true);
      const instruction: TransactionInstruction[] = [];

      if (isGroup) {
        if (!groupData) return;
        console.log(message.address.toBase58(), "message");
        const inst = await deleteGroupMessage(
          new PublicKey(groupKey),
          message.address,
          wallet.publicKey,
          message.index,
          groupData.owner,
          groupData?.groupName,
          isAdmin
            ? groupData?.admins
                .map((e) => e.toBase58())
                .indexOf(wallet.publicKey.toBase58())
            : undefined
        );
        instruction.push(inst);
      } else {
        const realReceiver = message.receiver.equals(message.message.sender)
          ? message.sender
          : message.receiver;
        const inst = await deleteMessage(
          message.message.sender,
          realReceiver,
          message.address,
          message.index
        );
        instruction.push(inst);
      }

      const tx = await sendTransaction({
        connection,
        instruction,
        wallet,
        signers: [],
      });
      console.log(tx);
    } catch (err) {
      console.log(err);
    } finally {
      await sleep(1_500);
      setLoading(false);
      navigation.goBack();
    }
  };

  return (
    <TouchableWithoutFeedback
      onLongPress={handleOnLongPressDelete}
      delayLongPress={1_000}
      onPress={() => setShowDelete(false)}
    >
      <View style={isUser ? styles.rootUser : styles.rootContact}>
        <View
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          {showDelete && isUser && (
            <TouchableOpacity onPress={handleOnPressDelete}>
              {loading ? (
                <ActivityIndicator />
              ) : (
                <MaterialCommunityIcons name="delete" size={24} color="red" />
              )}
            </TouchableOpacity>
          )}
          <View
            style={isUser ? styles.messageBoxUser : styles.messageBoxContact}
          >
            {showSender && !isUser && (
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate("Profile", {
                    contact: message.message.sender.toBase58(),
                  })
                }
              >
                <Text
                  style={[
                    styles.senderName,
                    {
                      color: contactColor(
                        displayName ? displayName[0] : undefined
                      ),
                    },
                  ]}
                >
                  {formatDisplayName(displayName ? displayName[0] : undefined)}{" "}
                  {isAdmin && <Text> - Admin</Text>}
                </Text>
              </TouchableOpacity>
            )}
            <Text
              style={[
                isUser ? styles.messageTextUser : styles.messageTextContact,
              ]}
            >
              {decrypted}
            </Text>
          </View>
          {showDelete && !isUser && (
            <TouchableOpacity onPress={handleOnPressDelete}>
              {loading ? (
                <ActivityIndicator />
              ) : (
                <MaterialCommunityIcons name="delete" size={24} color="black" />
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  messageTextUser: {
    color: "white",
    textAlign: "right",
    maxWidth: "100%",
  },
  messageTextContact: {
    color: "white",
    textAlign: "left",
    maxWidth: "100%",
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
  senderName: {
    fontSize: 12,
    fontWeight: "bold",
    color: "rgb(250, 163, 87)",
    marginBottom: 5,
  },
});
