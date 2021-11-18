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

export const ThreadScreen = () => {
  const isFocused = useIsFocused();
  const [refresh, setRefresh] = useState(false);
  const { wallet, walletLoaded } = useWallet();
  const [threads] = useUserThread(refresh != isFocused);
  const navigation = useNavigation<settingsScreenProp>();
  const archived = useGetAsyncCache<string[]>(CachePrefix.Archive, refresh);
  const [groups] = useUserGroup(wallet?.publicKey, refresh != isFocused);

  const handleOnRefresh = () => {
    setRefresh((prev) => !prev);
  };

  useEffect(() => {
    if (!wallet && walletLoaded) {
      navigation.navigate("Settings");
    }
  }, []);

  const memoizedThread = useMemo(() => {
    return (
      <>
        {threads?.map((thread) => {
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
                navigation.navigate("Message", { contact: contact.toBase58() })
              }
              setRefresh={setRefresh}
            />
          );
        })}
      </>
    );
  }, [threads?.length, archived?.length]);

  const memoizeGroups = useMemo(() => {
    return (
      <>
        {groups?.map((group, idx) => {
          return (
            <GroupMessageRow
              archived={archived}
              picHash={group.groupData.groupPicHash}
              groupName={group.groupData.groupName}
              groupKey={group.address}
              key={group.groupData.groupName + idx}
              currentCount={group.groupData.msgCount}
              setRefresh={setRefresh}
              handleOnPressDisplayName={() =>
                navigation.navigate("Group Messages", {
                  group: group.address.toBase58(),
                  name: group.groupData.groupName,
                })
              }
            />
          );
        })}
      </>
    );
  }, [groups?.length, archived?.length]);

  return (
    <SafeAreaView style={styles.safeAreaView}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={handleOnRefresh} />
        }
      >
        <View style={{ width: "100%" }}>
          {memoizeGroups}
          {memoizedThread}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeAreaView: {
    height: "100%",
  },
  root: {
    flex: 1,
    flexDirection: "column",
  },
});
