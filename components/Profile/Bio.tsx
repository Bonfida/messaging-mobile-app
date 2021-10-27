import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useProfile } from "../../utils/jabber";
import { MaterialIcons } from "@expo/vector-icons";
import { useWallet } from "../../utils/wallet";

export const RenderBio = ({ refresh }: { refresh: boolean }) => {
  const { wallet } = useWallet();
  const [profile] = useProfile(wallet!.publicKey, refresh);
  return (
    <View style={styles.container}>
      <Text style={styles.value}>
        {profile === undefined || profile?.bio === "" ? "No bio" : profile.bio}
      </Text>
      <MaterialIcons name="arrow-forward-ios" size={15} color="black" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    flexDirection: "row",
  },
  value: {
    marginRight: 5,
  },
});
