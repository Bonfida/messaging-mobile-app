import React from "react";
import { useDisplayName } from "../../utils/name-service";
import { View, ActivityIndicator, Text, StyleSheet } from "react-native";
import { RenderProfilePic } from "./RenderProfilePic";
import { PublicKey } from "@solana/web3.js";

export const ProfileRow = ({ address }: { address: PublicKey }) => {
  const [displayName] = useDisplayName(address?.toBase58());
  const firstLetter =
    displayName && displayName[0]
      ? displayName[0][0].toLocaleUpperCase()
      : address.toBase58()[0].toUpperCase();

  if (!displayName || !address) {
    return (
      <View style={styles.profileRow}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.profileRow}>
      <RenderProfilePic firstLetter={firstLetter} address={address} />
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
