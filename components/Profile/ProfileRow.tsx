import React from "react";
import { View, ActivityIndicator, Text, StyleSheet } from "react-native";
import { RenderProfilePic } from "./RenderProfilePic";

export const ProfileRow = ({
  name,
  hashPic,
}: {
  name: string | undefined;
  hashPic: string | undefined;
}) => {
  const firstLetter = name && name[0] && name[0][0];

  if (!name || !firstLetter) {
    return (
      <View style={styles.profileRow}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.profileRow}>
      <RenderProfilePic firstLetter={firstLetter} hashPic={hashPic} />
      <Text numberOfLines={1} ellipsizeMode="tail" style={styles.accountName}>
        {firstLetter + name?.slice(1)}
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
    maxWidth: "50%",
  },
});
