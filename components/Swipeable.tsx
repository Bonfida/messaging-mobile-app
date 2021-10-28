// Lifted from https://github.com/software-mansion/react-native-gesture-handler/blob/master/example/src/showcase/swipeable/AppleStyleSwipeableRow.tsx
import React, { Component } from "react";
import { Animated, StyleSheet, View, I18nManager } from "react-native";

// TODO finish archive

import { Ionicons } from "@expo/vector-icons";
import { FontAwesome5 } from "@expo/vector-icons";
import { RectButton } from "react-native-gesture-handler";

import Swipeable from "react-native-gesture-handler/Swipeable";
import { PublicKey } from "@solana/web3.js";
import { asyncCache, CachePrefix } from "../utils/cache";

interface IProps {
  contact: PublicKey;
  archived?: boolean;
}

export default class AppleStyleSwipeableRow extends Component<IProps> {
  constructor(props: IProps) {
    super(props);
  }
  private renderRightAction = (
    color: string,
    x: number,
    progress: Animated.AnimatedInterpolation,
    icon: React.ReactNode
  ) => {
    const trans = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [x, 0],
    });
    const pressHandler = async () => {
      this.close();
      const archived = (await asyncCache.get(CachePrefix.Archive)) || [];
      await asyncCache.set(CachePrefix.Archive, [
        ...archived,
        this.props.contact.toBase58(),
      ]);
    };

    const pressHandlerArchived = async () => {
      this.close();
      const archived: string[] =
        (await asyncCache.get(CachePrefix.Archive)) || [];
      const idx = archived.indexOf(this.props.contact.toBase58());
      if (idx === -1) return;
      const newArray = archived.slice(0, idx).concat(archived.slice(idx + 1));
      await asyncCache.set(CachePrefix.Archive, newArray);
    };

    return (
      <Animated.View style={{ flex: 1, transform: [{ translateX: trans }] }}>
        <RectButton
          style={[styles.rightAction, { backgroundColor: color }]}
          onPress={this.props.archived ? pressHandlerArchived : pressHandler}
        >
          {icon}
        </RectButton>
      </Animated.View>
    );
  };

  private renderRightActions = (progress: Animated.AnimatedInterpolation) => (
    <View
      style={{
        width: 80,
        flexDirection: I18nManager.isRTL ? "row-reverse" : "row",
        height: "100%",
      }}
    >
      {this.renderRightAction(
        this.props.archived ? "#4cd964" : "#C8C7CD",
        80,
        progress,
        this.props.archived ? (
          <FontAwesome5 name="trash-restore" size={24} color="black" />
        ) : (
          <Ionicons name="ios-archive" size={24} color="black" />
        )
      )}
    </View>
  );

  private swipeableRow?: Swipeable;

  private updateRef = (ref: Swipeable) => {
    this.swipeableRow = ref;
  };
  private close = () => {
    this.swipeableRow?.close();
  };
  render() {
    const { children } = this.props;
    return (
      <Swipeable
        ref={this.updateRef}
        friction={2}
        enableTrackpadTwoFingerGesture
        leftThreshold={30}
        rightThreshold={40}
        renderRightActions={this.renderRightActions}
      >
        {children}
      </Swipeable>
    );
  }
}

const styles = StyleSheet.create({
  leftAction: {
    flex: 1,
    backgroundColor: "#497AFC",
    justifyContent: "center",
  },
  actionText: {
    color: "white",
    fontSize: 16,
    backgroundColor: "transparent",
    padding: 10,
  },
  rightAction: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
});
