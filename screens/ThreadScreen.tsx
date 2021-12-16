import React, { useMemo, useRef, useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  View,
  Button,
} from "react-native";
import { useGroupData, useGroupMessage, useUserThread } from "../utils/jabber";
import MessageRow from "../components/ContactRow";
import { useWallet } from "../utils/wallet";
import { RenderMessage } from "../components/RenderMessage";
import { useMessageDataWs } from "../utils/jabber";
import { PublicKey } from "@solana/web3.js";
import { FeeWarning } from "../components/FeeWarning";
import { MessageInput } from "../components/MessageInput";
import { useUserGroup } from "../utils/jabber";
import GroupMessageRow from "../components/GroupRow";
import { CachePrefix, useGetAsyncCache } from "../utils/cache";
import { useIsFocused } from "@react-navigation/core";

export const ThreadScreen = () => {
  const [refresh, setRefresh] = useState(false);
  const [isGroup, setIsGroup] = useState(false);
  const isFocused = useIsFocused();
  const { wallet, connected, connect } = useWallet();
  const [threadsWithTime] = useUserThread(connected);
  const archived = useGetAsyncCache<string[]>(
    CachePrefix.Archive,
    refresh !== isFocused
  );
  const [selectedContact, setSelectedContact] = useState<string | null>(null);
  const messages = useMessageDataWs(
    selectedContact,
    isGroup ? undefined : wallet?.publicKey?.toBase58()
  );

  const groupData = useGroupData(isGroup ? selectedContact : undefined);
  const groupMessages = useGroupMessage(
    groupData,
    isGroup ? selectedContact : undefined
  );

  const [groupsWithTime] = useUserGroup(
    wallet?.publicKey,
    refresh != isFocused
  );

  const scrollViewRef = useRef() as React.MutableRefObject<ScrollView>;

  const memoizedMessages = useMemo(() => {
    return (
      <>
        {messages?.map((m, key) => {
          if (!m) return null;
          return (
            <View key={key}>
              <RenderMessage message={m} />
            </View>
          );
        })}
      </>
    );
  }, [messages?.length, selectedContact]);

  const memoizedGroupMessages = useMemo(() => {
    return (
      <>
        {groupMessages?.map((m, key) => {
          if (!m) return null;
          return (
            <View key={key}>
              <RenderMessage message={m} />
            </View>
          );
        })}
      </>
    );
  }, [groupMessages?.length, selectedContact, groupData?.groupName]);

  const memoizedThread = useMemo(() => {
    return (
      <>
        {threadsWithTime?.map(({ thread }) => {
          const contact: PublicKey = wallet?.publicKey.equals(thread?.user1)
            ? thread?.user2
            : thread?.user1;
          if (!thread) return null;

          return (
            <MessageRow
              selected={contact.toBase58() === selectedContact}
              key={`thread-${thread.user1.toBase58()}-${thread.user2.toBase58()}`}
              contact={contact}
              currentCount={thread.msgCount}
              archived={archived}
              handleOnPressDisplayName={() => {
                setIsGroup(false);
                setSelectedContact(contact.toBase58());
              }}
              setRefresh={setRefresh}
            />
          );
        })}
      </>
    );
  }, [threadsWithTime?.length, archived?.length, selectedContact]);

  const memoizeGroups = useMemo(() => {
    return (
      <>
        {groupsWithTime?.map(({ groupData, address }, idx) => {
          return (
            <GroupMessageRow
              picHash={groupData.groupPicHash}
              selected={selectedContact === address.toBase58()}
              groupName={groupData.groupName}
              groupKey={address}
              key={groupData.groupName + idx}
              currentCount={groupData.msgCount}
              setRefresh={setRefresh}
              handleOnPressDisplayName={() => {
                setIsGroup(true);
                setSelectedContact(address.toBase58());
              }}
            />
          );
        })}
      </>
    );
  }, [groupsWithTime?.length, archived?.length, selectedContact]);

  const memoizedWarning = useMemo(() => {
    if (!selectedContact) {
      return null;
    }
    return <FeeWarning contact={selectedContact} />;
  }, [selectedContact]);

  if (!connected) {
    return (
      <View style={styles.connectContainer}>
        <Button title="Connect your wallet" onPress={connect} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeAreaView}>
        <ScrollView>
          <View style={styles.threadContainer}>
            {memoizeGroups}
            {memoizedThread}
          </View>
        </ScrollView>
      </SafeAreaView>
      <View style={styles.conversationContainer}>
        {selectedContact && (
          <>
            {memoizedWarning}
            <View style={styles.contentContainer}>
              <ScrollView
                ref={scrollViewRef}
                onContentSizeChange={() =>
                  scrollViewRef.current.scrollToEnd({ animated: true })
                }
              >
                {isGroup ? memoizedGroupMessages : memoizedMessages}
              </ScrollView>
              <MessageInput
                contact={selectedContact}
                groupData={groupData}
                scrollViewRef={scrollViewRef}
              />
            </View>
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  safeAreaView: {
    height: "100%",
    width: "30%",
    borderRightColor: "black",
    borderRightWidth: 1,
  },
  root: {
    display: "flex",
    flexDirection: "row",
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    height: "100%",
    justifyContent: "flex-end",
  },
  threadContainer: {
    width: "100%",
  },
  conversationContainer: {
    width: "70%",
  },
  connectContainer: {
    flex: 1,
    height: "100%",
    justifyContent: "center",
    backgroundColor: "rgb(240 ,240, 240)",
    alignItems: "center",
  },
});
