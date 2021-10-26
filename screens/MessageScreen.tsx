import React, { useState, useRef, useMemo } from "react";
import { useMessageData } from "../utils/jabber";
import { RefreshControl, View, ScrollView, StyleSheet } from "react-native";
import { useWallet } from "../utils/wallet";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { RenderMessage } from "../components/RenderMessage";
import { LoadingScreen } from "../components/LoadingScreen";
import { FeeWarning } from "../components/FeeWarning";
import { MessageInput } from "../components/MessageInput";

const MessageScreen = ({ route }) => {
  const { contact } = route.params;
  const { wallet } = useWallet();
  const [refresh, setRefresh] = useState(false);

  const [messages] = useMessageData(
    contact,
    wallet?.publicKey.toBase58(),
    refresh
  );

  const scrollViewRef = useRef();

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
  }, [messages?.length]);

  if (!messages) {
    return <LoadingScreen />;
  }

  return (
    <>
      <FeeWarning contact={contact} />
      <KeyboardAwareScrollView
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={!messages}
            onRefresh={() => setRefresh((prev) => !prev)}
          />
        }
      >
        <ScrollView
          contentContainerStyle={styles.contentContainer}
          // @ts-ignore
          ref={scrollViewRef}
          onContentSizeChange={() =>
            // @ts-ignore
            scrollViewRef.current.scrollToEnd({ animated: true })
          }
        >
          {memoizedMessages}
        </ScrollView>
        <MessageInput contact={contact} />
      </KeyboardAwareScrollView>
    </>
  );
};

export default MessageScreen;

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
    height: "100%",
    justifyContent: "flex-end",
  },
});
