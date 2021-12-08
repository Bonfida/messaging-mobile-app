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
import {
  abbreviateAddress,
  formatDisplayName,
  sleep,
} from "../utils/utils.native";
import { useNavigation } from "@react-navigation/native";
import { profileScreenProp } from "../types";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { deleteGroupMessage, deleteMessage } from "@bonfida/jabber";
import { PublicKey, TransactionInstruction } from "@solana/web3.js";
import { sendTransaction } from "../utils/send";
import { useConnection } from "../utils/connection";

// TODO delete message feature

const Circle = ({ name }: { name: string }) => {
  return (
    <View style={styles.circle}>
      <Text style={styles.circleText}>{name.toUpperCase()}</Text>
    </View>
  );
};

const Delete = () => {
  return <MaterialCommunityIcons name="delete" size={24} color="black" />;
};

const SenderName = ({
  contact,
  isUser,
  displayName,
  isAdmin,
}: {
  contact: string;
  isUser: boolean;
  displayName: string;
  isAdmin: boolean;
}) => {
  const navigation = useNavigation<profileScreenProp>();
  return (
    <TouchableOpacity
      onPress={() =>
        navigation.navigate("Profile", {
          contact,
        })
      }
    >
      <Text style={[styles.senderName, isUser ? styles.blue : styles.pink]}>
        {displayName} {isAdmin && <Text> - Admin</Text>}
      </Text>
    </TouchableOpacity>
  );
};

export const MessageBoxText = ({
  message,
  encrypted = true,
  groupKey,
}: {
  message: IMessage;
  encrypted?: boolean;
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
      <View style={styles.container}>
        <Circle
          name={
            displayName
              ? displayName[0].slice(0, 2)
              : message.message.sender.toBase58().slice(0, 2)
          }
        />
        <View style={styles.innerContainer}>
          <SenderName
            displayName={
              displayName && displayName[0]
                ? (formatDisplayName(displayName[0]) as string)
                : (abbreviateAddress(message.sender) as string)
            }
            isAdmin={isAdmin}
            isUser={isUser}
            contact={message.sender.toBase58()}
          />

          <Text style={styles.messageText}>{decrypted}</Text>

          {showDelete && (
            <TouchableOpacity onPress={handleOnPressDelete}>
              {loading ? <ActivityIndicator /> : <Delete />}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "flex-start",
    flexDirection: "row",
    width: "90%",
    marginLeft: "5%",
    marginRight: "5%",
    marginTop: 20,
  },
  innerContainer: {
    marginLeft: 10,
    display: "flex",
    alignItems: "flex-start",
    width: "100%",
  },
  senderName: {
    fontSize: 12,
    fontWeight: "bold",
  },
  messageContainer: {
    width: "95%",
  },
  blue: {
    color: "#60C0CB",
  },
  pink: {
    color: "#C0A9C7",
  },
  messageText: {
    fontSize: 18,
    color: "#2A2346",
    width: "90%",
  },
  circle: {
    height: 24,
    width: 24,
    borderRadius: 12,
    backgroundColor: "#7C7CFF",
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  circleText: {
    fontSize: 10,
  },
});
