import React, { useEffect, useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { useDisplayName } from "../utils/name-service";
import { useNavigation, useIsFocused } from "@react-navigation/native";
import { Line } from "./Line";
import { useProfilePic } from "../utils/jabber";
import { asyncCache, CachePrefix } from "../utils/cache";
import { Thread } from "../utils/web3/jabber";
import { useWallet } from "../utils/wallet";
import Swipeable from "./Swipeable";
import { profileScreenProp } from "../types";
import { isWeb } from "../utils/utils";

export const Circle = ({ name }: { name: string }) => {
  return (
    <View style={styles.circle}>
      <Text style={styles.circleText}>{name.toUpperCase()}</Text>
    </View>
  );
};

const UnReadIcon = ({ unread }: { unread: number }) => {
  return (
    <View style={styles.unreadCircle}>
      <Text style={styles.unreadCount}>{unread < 100 ? unread : "+99"}</Text>
    </View>
  );
};

const MessageRow = ({
  contact,
  currentCount,
  handleOnPressDisplayName,
  showArchived,
  archived,
  selected,
  setRefresh,
}: {
  contact: PublicKey;
  currentCount: number;
  setRefresh: React.Dispatch<React.SetStateAction<boolean>>;
  handleOnPressDisplayName?: () => void;
  showArchived?: boolean;
  archived?: string[] | null;
  selected?: boolean;
}) => {
  const base58 = contact?.toBase58();
  const [displayName] = useDisplayName(base58);
  const firstLetter =
    displayName && displayName[0] ? displayName[0].slice(0, 2) : base58[0];
  const navigation = useNavigation<profileScreenProp>();
  const { wallet } = useWallet();
  const pic = useProfilePic(contact);
  const [lastCount, setLastCount] = useState<null | number>(null);
  const isFocused = useIsFocused();
  const [threadKey, setThreadKey] = useState<PublicKey | undefined>(undefined);

  useEffect(() => {
    const fn = async () => {
      const key = await Thread.getKeys(contact, wallet?.publicKey);
      setThreadKey(key);
      const cachedCount = await asyncCache.get<number>(
        CachePrefix.LastMsgCount + key?.toBase58()
      );
      setLastCount(cachedCount);
    };
    fn();
  }, [isFocused]);

  const unread = showArchived ? 0 : Math.abs(currentCount - (lastCount || 0));

  const handleOnPressUnread = async () => {
    setLastCount(currentCount);
    await asyncCache.set(
      CachePrefix.LastMsgCount + threadKey?.toBase58(),
      currentCount
    );
  };

  const handleOnPressProfile = () => {
    navigation.navigate("Profile", { contact: base58 });
  };

  if (archived?.includes(contact.toBase58()) && !showArchived) {
    return null;
  }

  return (
    <Swipeable
      setRefresh={setRefresh}
      contact={contact}
      archived={showArchived}
    >
      <View
        style={[
          styles.row,
          {
            backgroundColor: selected ? "#B2B1B9" : undefined,
            width: isWeb ? "100%" : undefined,
            height: isWeb ? "100%" : undefined,
            marginTop: isWeb ? undefined : 10,
          },
        ]}
      >
        <View style={styles.profilePicContainer}>
          <TouchableOpacity onPress={handleOnPressProfile}>
            {pic ? (
              <Image source={{ uri: pic }} style={styles.profilePic} />
            ) : (
              <Circle name={firstLetter} />
            )}
          </TouchableOpacity>
          <View style={styles.displayName}>
            <TouchableOpacity onPress={handleOnPressDisplayName}>
              <Text
                numberOfLines={1}
                ellipsizeMode="tail"
                style={styles.nameText}
              >
                {displayName ? displayName[0] : contact.toBase58().slice(1)}{" "}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.unreadContainer}>
          {unread !== 0 && (
            <TouchableOpacity onPress={handleOnPressUnread}>
              <UnReadIcon unread={unread} />
            </TouchableOpacity>
          )}
        </View>
      </View>
      <Line width="100%" />
    </Swipeable>
  );
};

export default MessageRow;

const styles = StyleSheet.create({
  row: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingLeft: 10,
    paddingRight: 10,
    marginBottom: 10,
  },
  displayName: {
    width: "65%",
    marginRight: 5,
  },
  item: {
    margin: 10,
  },
  circle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#7C7CFF",
  },
  circleText: {
    fontSize: 25,
    fontWeight: "bold",
  },
  nameText: {
    fontSize: 20,
    marginLeft: 10,
    color: "#12192E",
    fontWeight: "500",
  },
  unreadContainer: {
    width: "10%",
    marginRight: 10,
  },
  profilePicContainer: {
    width: "80%",
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
  },
  profilePic: {
    width: 70,
    height: 70,
    borderRadius: 70 / 2,
  },
  unreadCircle: {
    width: 45,
    height: 35,
    borderRadius: 35 / 2,
    backgroundColor: "#007bff",
    marginRight: 10,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
  },
  unreadCount: {
    color: "white",
    fontWeight: "bold",
    fontSize: 14,
  },
  container: {
    justifyContent: "flex-start",
    alignItems: "center",
    display: "flex",
    flexDirection: "row",
  },
});
