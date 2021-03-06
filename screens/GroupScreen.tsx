import React, { useRef, useMemo, useEffect } from "react";
import { useGroupData, useGroupMessage } from "../utils/jab";
import { View, ScrollView, StyleSheet, SafeAreaView } from "react-native";
import { RenderMessage } from "../components/RenderMessage";
import { RouteProp } from "@react-navigation/core";
import { RootStackParamList } from "../App";
import { MessageInput } from "../components/MessageInput";
import { FeeWarningGroup } from "../components/FeeWarning";
import { asyncCache, CachePrefix } from "../utils/cache";
import { useWallet } from "../utils/wallet.native";
import { MutedWarning } from "../components/MutedWarning";
import GlobalStyle from "../Style";

const MessageGroupScreen = ({
  route,
}: {
  route: RouteProp<RootStackParamList, "Group Messages">;
}) => {
  const { group } = route.params;
  const { wallet } = useWallet();
  const groupData = useGroupData(group);
  const messages = useGroupMessage(groupData, group);

  const scrollViewRef = useRef() as React.MutableRefObject<ScrollView>;

  useEffect(() => {
    const fn = async () => {
      if (!messages || !groupData) return;
      await asyncCache.set(
        CachePrefix.LastMsgCount + group,
        groupData?.msgCount
      );
    };
    fn();

    return () => {
      fn().then(() => console.log("Update last message count"));
    };
  }, [messages?.length, groupData?.msgCount]);

  const memoizedMessages = useMemo(() => {
    return (
      <>
        {messages?.map((m, key) => {
          if (!m) return null;
          return (
            <View key={key}>
              <RenderMessage message={m} groupKey={group} />
            </View>
          );
        })}
      </>
    );
  }, [messages?.length]);

  const isAdmin = groupData?.admins.find((e) => wallet?.publicKey.equals(e));
  const muted =
    groupData?.adminOnly &&
    !isAdmin &&
    !wallet?.publicKey.equals(groupData.owner);

  return (
    <SafeAreaView style={GlobalStyle.container}>
      {muted && <MutedWarning />}
      <FeeWarningGroup groupData={groupData} />
      <View style={styles.contentContainer}>
        <ScrollView
          ref={scrollViewRef}
          onContentSizeChange={() =>
            scrollViewRef.current.scrollToEnd({ animated: true })
          }
        >
          {memoizedMessages}
        </ScrollView>
        <MessageInput
          contact={group}
          groupData={groupData}
          scrollViewRef={scrollViewRef}
          muted={muted}
        />
      </View>
    </SafeAreaView>
  );
};

export default MessageGroupScreen;

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
    height: "100%",
    justifyContent: "flex-end",
  },
});
