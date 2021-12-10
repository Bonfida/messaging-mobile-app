import React from "react";
import { useWallet } from "../utils/wallet";
import { useLoadMedia, IMessage, MediaType } from "../utils/jabber";
import { findType } from "../utils/jabber";
import {
  View,
  Image,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { WebView } from "react-native-webview";
import { useNavigation } from "@react-navigation/native";
import { mediaScreenProp } from "../types";
import { SenderName, Circle } from "./MessageBoxText";
import { useDisplayName } from "../utils/name-service";
import { abbreviateAddress, formatDisplayName } from "../utils/utils.native";

const createHtml = (content: string) => {
  const head = `<style>body{margin:0}</style><meta name="viewport" content="width=device-width, initial-scale=1">`;
  const html = `<!DOCTYPE html><html><head>${head}</head><body style="background-color: rgb(239, 239, 239);">${content}</body></html>`;
  return html;
};

export const MessageBoxMedia = ({
  message,
  encrypted = true,
}: {
  message: IMessage;
  encrypted?: boolean;
}) => {
  const { wallet } = useWallet();
  const [media, type] = useLoadMedia(message, encrypted);
  const isUser = wallet?.publicKey.equals(message.message.sender);
  const parsedType = findType(type);
  const navigation = useNavigation<mediaScreenProp>();
  const [displayName] = useDisplayName(message.message.sender.toBase58());

  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    return (
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
            isAdmin={false}
            isUser={isUser}
            contact={message.sender.toBase58()}
          />
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
        <TouchableOpacity
          onPress={() =>
            navigation.navigate("Media", {
              uri: `data:${type};base64,${media}`,
            })
          }
        >
          <Image
            resizeMode="contain"
            style={styles.img}
            source={{ uri: `data:${type};base64,${media}` }}
          />
        </TouchableOpacity>
      </Wrapper>
    );
  }

  return null;
};

const styles = StyleSheet.create({
  img: {
    height: 200,
    width: 200,
  },
  audio: {
    marginLeft: 5,
    marginTop: 5,
    height: 40,
    width: 300,
  },
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
});
