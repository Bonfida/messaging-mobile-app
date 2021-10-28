import React, { useRef, useMemo } from "react";
import { useMessageDataWs } from "../utils/jabber";
import { View, ScrollView, StyleSheet } from "react-native";
import { useWallet } from "../utils/wallet";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { RenderMessage } from "../components/RenderMessage";
import { LoadingScreen } from "../components/LoadingScreen";
import { FeeWarning } from "../components/FeeWarning";
import { MessageInput } from "../components/MessageInput";
import { RouteProp } from "@react-navigation/native";
import { RootStackParamList } from "../App";

const MessageScreen = ({
  route,
}: {
  route: RouteProp<RootStackParamList, "Message">;
}) => {
  const { contact } = route.params;
  const { wallet } = useWallet();

  const messages = useMessageDataWs(contact, wallet?.publicKey.toBase58());

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
  }, [messages?.length]);

  if (!messages) {
    return <LoadingScreen />;
  }

  return (
    <>
      <FeeWarning contact={contact} />
      <KeyboardAwareScrollView contentContainerStyle={styles.contentContainer}>
        <ScrollView
          ref={scrollViewRef}
          onContentSizeChange={() =>
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
