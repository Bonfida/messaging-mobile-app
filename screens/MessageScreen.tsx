import React, { useState, useRef, useMemo, useEffect } from "react";
import {
  encryptMessageToBuffer,
  findType,
  useMessageData,
} from "../utils/jabber";
import {
  RefreshControl,
  Text,
  View,
  StyleSheet,
  TextInput,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useWallet } from "../utils/wallet";
import {
  IMessage,
  decrytMessageFromBuffer,
  useLoadMedia,
  MediaType,
  useContactFees,
} from "../utils/jabber";
import { Thread, Message, sendMessage } from "../utils/web3/jabber";
import { findProgramAddress } from "../utils/web3/program-address";
import { JABBER_ID, MessageType } from "@bonfida/jabber";
import { useConnection } from "../utils/connection";
import { PublicKey } from "@solana/web3.js";
import { signAndSendTransactionInstructions, sleep } from "../utils/utils";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { Ionicons } from "@expo/vector-icons";
import { WebView } from "react-native-webview";
import UploadIpfsButton from "../components/UploadIpfsButton";
import { useCache, CachePrefix } from "../utils/cache";
import { Buffer } from "buffer";

// TODO
// Make more components?
// Warning si contact requires > 0 SOL ✅
// File upload
// Webview? ✅
// Better profile ✅
// Check domain name ✅
// Write new message ✅
// Scroll problem

export const MessageBoxText = ({ message }: { message: IMessage }) => {
  const { wallet } = useWallet();
  const { getCache, setCache } = useCache();
  const [decrypted, setDecrypted] = useState<undefined | string>(undefined);
  const cacheKey = CachePrefix.DecryptedMessage + message.address.toBase58();

  useEffect(() => {
    const cached = getCache(cacheKey);
    if (!cached) {
      const _decrypted = decrytMessageFromBuffer(
        message.message.msg,
        message.address,
        wallet,
        message.message.sender
      ) as string;
      setCache(cacheKey, _decrypted);
      setDecrypted(_decrypted);
    } else {
      setDecrypted(cached);
    }
  }, []);

  const isUser = wallet?.publicKey.equals(message.message.sender);

  return (
    <View style={isUser ? styles.rootUser : styles.rootContact}>
      <View style={isUser ? styles.messageBoxUser : styles.messageBoxContact}>
        <Text
          style={isUser ? styles.messageTextUser : styles.messageTextContact}
        >
          {decrypted}
        </Text>
      </View>
    </View>
  );
};

const createHtml = (content: string) => {
  const head = `<style>body{margin:0}</style><meta name="viewport" content="width=device-width, initial-scale=1">`;
  const html = `<!DOCTYPE html><html><head>${head}</head><body style="background-color: rgb(239, 239, 239);">${content}</body></html>`;
  return html;
};

export const MessageBoxMedia = ({ message }: { message: IMessage }) => {
  const { wallet } = useWallet();
  const [media, type] = useLoadMedia(message);
  const isUser = wallet?.publicKey.equals(message.message.sender);
  const parsedType = findType(type);

  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    return (
      <View style={isUser ? styles.rootUser : styles.rootContact}>
        <View style={isUser ? styles.messageBoxUser : styles.messageBoxContact}>
          {children}
        </View>
      </View>
    );
  };

  if (!media || parsedType === null) {
    return (
      <Wrapper>
        <ActivityIndicator style={styles.img} />
      </Wrapper>
    );
  }

  const [width, height] = [220, 220];

  if (parsedType === MediaType.Video) {
    const iframeHtml = `<iframe autoplay="0" width="${width}" height="${height}" style="height:${height}px;width:${width}px;" src="data:${type};base64,${media}"></iframe>`;
    return (
      <View style={{ marginLeft: 5, width, height }}>
        <WebView
          style={{ width, height }}
          scalesPageToFit={true}
          originWhitelist={["*"]}
          source={{
            html: createHtml(iframeHtml),
          }}
        />
      </View>
    );
  }

  if (parsedType === MediaType.Audio) {
    const audioHtml = `<audio controls src="data:${type};base64,${media}"></audio>`;
    return (
      <View style={styles.audio}>
        <WebView
          scalesPageToFit={true}
          originWhitelist={["*"]}
          source={{
            html: createHtml(audioHtml),
          }}
        />
      </View>
    );
  }

  if (parsedType === MediaType.Image) {
    return (
      <Wrapper>
        <Image
          resizeMode="contain"
          style={styles.img}
          source={{ uri: `data:${type};base64,` + media }}
        />
      </Wrapper>
    );
  }

  return null;
};

export const RenderMessage = ({ message }: { message: IMessage }) => {
  switch (message?.message?.kind) {
    case MessageType.Encrypted:
      return <MessageBoxText message={message} />;
    case MessageType.EncryptedImage:
      return <MessageBoxMedia message={message} />;
    default:
      return null;
  }
};

const MessageScreen = ({ route }) => {
  const { contact } = route.params;
  const { wallet } = useWallet();
  const connection = useConnection();
  const [refresh, setRefresh] = useState(false);
  const [loading, setLoading] = useState(false);
  const [messages, messagesLoading] = useMessageData(
    contact,
    wallet?.publicKey.toBase58(),
    refresh
  );
  const [message, setMessage] = useState<string | undefined>(undefined);
  const scrollViewRef = useRef();
  const [contactFee] = useContactFees(contact);

  const handeleOnSubmit = async () => {
    if (!message || !wallet) return;
    try {
      setLoading(true);
      const receiver = new PublicKey(contact);

      const thread = await Thread.retrieve(
        connection,
        receiver,
        wallet.publicKey
      );

      const seeds = Message.generateSeeds(
        thread.msgCount,
        receiver,
        wallet.publicKey
      );
      const [messageAccount] = findProgramAddress(seeds, JABBER_ID);

      const encrypted = encryptMessageToBuffer(
        message,
        wallet,
        receiver,
        messageAccount
      );

      const instruction = await sendMessage(
        connection,
        wallet.publicKey,
        receiver,
        encrypted,
        MessageType.Encrypted
      );

      const tx = await signAndSendTransactionInstructions(
        connection,
        [],
        wallet,
        [instruction]
      );
      console.log(tx);
      setMessage(undefined);
      await sleep(800);
      setRefresh((prev) => !prev);
    } catch {
      Alert.alert("Error", "Error sending message");
    } finally {
      setLoading(false);
    }
  };

  const memoizedMessages = useMemo(() => {
    return (
      <>
        {messages?.map((m, key) => {
          if (!m) return;
          return (
            <View key={key}>
              <RenderMessage message={m} />
            </View>
          );
        })}
      </>
    );
  }, [messages?.length]);

  return (
    <>
      {!!contactFee && (
        <View style={styles.feeWarning}>
          <Text style={styles.feeWarningText}>
            Your contact requires {contactFee} SOL per message
          </Text>
        </View>
      )}
      <KeyboardAwareScrollView
        // @ts-ignore
        ref={scrollViewRef}
        onContentSizeChange={() =>
          // @ts-ignore
          scrollViewRef.current.scrollToEnd({ animated: true })
        }
        contentContainerStyle={{
          flex: 1,
          height: "100%",
          justifyContent: "flex-end",
        }}
        refreshControl={
          <RefreshControl
            refreshing={!messages}
            onRefresh={() => setRefresh((prev) => !prev)}
          />
        }
      >
        {memoizedMessages}

        <View style={styles.textInput}>
          <TextInput
            value={message}
            style={styles.input}
            onChangeText={setMessage}
            placeholder="New Message"
            onSubmitEditing={handeleOnSubmit}
          />
          <TouchableOpacity disabled={!message} onPress={handeleOnSubmit}>
            {loading ? (
              <ActivityIndicator style={styles.icon} size="small" />
            ) : (
              <Ionicons
                style={styles.icon}
                name="send"
                size={24}
                color="blue"
              />
            )}
          </TouchableOpacity>
          <UploadIpfsButton />
        </View>
      </KeyboardAwareScrollView>
    </>
  );
};

export default MessageScreen;

const styles = StyleSheet.create({
  messageTextUser: {
    color: "white",
    textAlign: "right",
  },
  messageTextContact: {
    color: "white",
    textAlign: "left",
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
  input: {
    padding: 10,
    borderWidth: 0.5,
    borderRadius: 20,
    margin: 20,
    width: "70%",
  },
  status: {
    padding: 10,
    textAlign: "center",
  },
  img: {
    height: 200,
    width: 200,
  },
  textInput: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  icon: {
    marginRight: 20,
  },
  audio: {
    marginLeft: 5,
    marginTop: 5,
    height: 40,
    width: 300,
  },
  feeWarning: {
    backgroundColor: "rgb(233, 137, 39)",
    padding: 5,
  },
  feeWarningText: {
    fontWeight: "bold",
    fontSize: 14,
    textAlign: "center",
  },
});
