import React, { useState, useMemo, useEffect } from "react";
import {
  SafeAreaView,
  ScrollView,
  RefreshControl,
  StyleSheet,
  View,
} from "react-native";
import { useUserThread } from "../utils/jabber";
import { useNavigation, useIsFocused } from "@react-navigation/native";
import MessageRow from "../components/ContactRow";
import { useWallet } from "../utils/wallet.native";
import { CachePrefix, useGetAsyncCache } from "../utils/cache";
import { settingsScreenProp } from "../types";
import { PublicKey } from "@solana/web3.js";
import { useUserGroup } from "../utils/jabber";
import GroupMessageRow from "../components/GroupRow";
import GlobalStyle from "../Style";
import HomeMenu from "../components/HomeMenu";
import { GenericThread, IGroup } from "../types";

export const ThreadScreen = () => {
  const isFocused = useIsFocused();
  const [refresh, setRefresh] = useState(false);
  const { wallet, walletLoaded } = useWallet();
  const [threadsWithTime] = useUserThread(refresh != isFocused);
  const navigation = useNavigation<settingsScreenProp>();
  const archived = useGetAsyncCache<string[]>(CachePrefix.Archive, refresh);
  const [groupsWithTime] = useUserGroup(
    wallet?.publicKey,
    refresh != isFocused
  );

  const handleOnRefresh = () => {
    setRefresh((prev) => !prev);
  };

  useEffect(() => {
    if (!wallet && walletLoaded) {
      navigation.navigate("Settings");
    }
  }, []);

  const allThreadsWithTime: GenericThread[] | undefined =
    groupsWithTime && threadsWithTime && groupsWithTime.concat(threadsWithTime);

  const lastTime =
    allThreadsWithTime && Math.max(...allThreadsWithTime?.map((e) => e.time));

  const threads = useMemo(() => {
    return (
      <>
        {allThreadsWithTime
          ?.sort((a, b) => b.time - a.time)
          ?.map((genericThread, idx) => {
            console.log(genericThread.time);
            // Group thread
            if ("groupData" in genericThread) {
              const { groupData, address } = genericThread as IGroup;
              return (
                <GroupMessageRow
                  archived={archived}
                  picHash={groupData.groupPicHash}
                  groupName={groupData.groupName}
                  groupKey={address}
                  key={groupData.groupName + idx}
                  currentCount={groupData.msgCount}
                  setRefresh={setRefresh}
                  handleOnPressDisplayName={() =>
                    navigation.navigate("Group Messages", {
                      group: address.toBase58(),
                      name: groupData.groupName,
                    })
                  }
                />
              );
            }
            // DM thread
            const { thread } = genericThread;
            const contact: PublicKey = wallet?.publicKey.equals(thread?.user1)
              ? thread?.user2
              : thread?.user1;
            if (!thread) return null;
            return (
              <MessageRow
                key={`thread-${thread.user1.toBase58()}-${thread.user2.toBase58()}`}
                contact={contact}
                currentCount={thread.msgCount}
                archived={archived}
                handleOnPressDisplayName={() =>
                  navigation.navigate("Message", {
                    contact: contact.toBase58(),
                  })
                }
                setRefresh={setRefresh}
              />
            );
          })}
      </>
    );
  }, [allThreadsWithTime?.length, archived?.length, lastTime]);

  return (
    <SafeAreaView style={styles.safeAreaView}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={handleOnRefresh} />
        }
      >
        <View style={{ width: "100%" }}>{threads}</View>
      </ScrollView>
      <View style={styles.menu}>
        <HomeMenu />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeAreaView: {
    position: "relative",
    ...GlobalStyle.container,
  },
  root: {
    flex: 1,
    flexDirection: "column",
  },
  menu: {
    position: "absolute",
    alignSelf: "center",
    bottom: 0,
  },
});
