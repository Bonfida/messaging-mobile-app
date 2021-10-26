import React from "react";
import { useWallet } from "../../utils/wallet";
import { useDisplayName } from "../../utils/name-service";
import { View, ActivityIndicator, Text, StyleSheet } from "react-native";
import { RenderProfilePic } from "./RenderProfilePic";

export const ProfileRow = () => {
  const { wallet } = useWallet();
  const [displayName] = useDisplayName(wallet!.publicKey.toBase58());
  const firstLetter =
    displayName && displayName[0]
      ? displayName[0][0].toLocaleUpperCase()
      : wallet!.publicKey.toBase58()[0].toUpperCase();

  if (!displayName) {
    return (
      <View style={styles.profileRow}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.profileRow}>
      <RenderProfilePic firstLetter={firstLetter} />
      <Text style={styles.accountName}>
        {firstLetter + displayName?.slice(1)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  profileRow: {
    flexDirection: "row",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "10%",
  },
  accountName: {
    fontSize: 20,
    fontWeight: "bold",
    marginLeft: 20,
  },
});
