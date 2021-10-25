import React from "react";
import { useWallet } from "../utils/wallet";
import { useLoadMedia, IMessage, MediaType } from "../utils/jabber";
import { findType } from "../utils/jabber";
import { View, Image, ActivityIndicator, StyleSheet } from "react-native";
import { WebView } from "react-native-webview";

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

const styles = StyleSheet.create({
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
});
