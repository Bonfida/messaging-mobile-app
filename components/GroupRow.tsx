import React, { useEffect, useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { Line } from "./Line";
import { CachePrefix, asyncCache } from "../utils/cache";
import Swipeable from "./Swipeable";
import { isWeb } from "../utils/utils";
import { FontAwesome } from "@expo/vector-icons";
import { useIsFocused } from "@react-navigation/core";
import { useNavigation } from "@react-navigation/native";
import { groupInfoScreenProp } from "../types";
import { useGetIpfsData } from "../utils/jabber";

const COLORS = [
  "#e44f74",
  "#7839e9",
  "#7cb9f6",
  "#78cde6",
  "#45e9b1",
  "#0cbe1f",
  "#31a06b",
  "#30414c",
  "#c0c985",
  "#271132",
  "#48b6f4",
  "#e7c447",
];

const cache = new Map<string, string>();

export const Circle = ({ name }: { name: string }) => {
  const idx = Math.floor(Math.random() * COLORS.length);
  const cached = cache.get(name);
  const color = cached ? cached : COLORS[idx];
  if (!cached) cache.set(name, color);
  return (
    <View style={[styles.circle, { backgroundColor: color }]}>
      <FontAwesome name="group" size={28} color="black" />
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

const GroupMessageRow = ({
  groupKey,
  currentCount,
  handleOnPressDisplayName,
  showArchived,
  archived,
  selected,
  groupName,
  setRefresh,
  picHash,
}: {
  groupKey: PublicKey;
  currentCount: number;
  handleOnPressDisplayName?: () => void;
  showArchived?: boolean;
  archived?: string[] | null;
  selected?: boolean;
  groupName: string;
  setRefresh: React.Dispatch<React.SetStateAction<boolean>>;
  picHash: string;
}) => {
  const firstLetter = groupName[0];
  const [lastCount, setLastCount] = useState<null | number>(null);
  const isFocused = useIsFocused();
  const navigation = useNavigation<groupInfoScreenProp>();
  const pic = useGetIpfsData(picHash);

  useEffect(() => {
    const fn = async () => {
      const cachedCount = await asyncCache.get<number>(
        CachePrefix.LastMsgCount + groupKey?.toBase58()
      );
      setLastCount(cachedCount);
    };
    fn();
  }, [isFocused]);

  const unread = showArchived ? 0 : Math.abs(currentCount - (lastCount || 0));

  const handleOnPressUnread = async () => {
    setLastCount(currentCount);
    await asyncCache.set(
      CachePrefix.LastMsgCount + groupKey?.toBase58(),
      currentCount
    );
  };

  if (archived?.includes(groupKey.toBase58()) && !showArchived) {
    return null;
  }

  return (
    <Swipeable
      contact={groupKey}
      archived={showArchived}
      setRefresh={setRefresh}
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
          <TouchableOpacity
            onPress={() =>
              navigation.navigate("Group Info", { group: groupKey.toBase58() })
            }
          >
            {pic ? (
              <Image
                source={{ uri: `data:${pic.type};base64,${pic.media}` }}
                style={styles.circle}
              />
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
                {groupName}
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

export default GroupMessageRow;

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
  },
  circleText: {
    fontSize: 25,
    fontWeight: "bold",
  },
  nameText: {
    fontSize: 20,
    marginLeft: 10,
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
