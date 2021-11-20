import React from "react";
import { View, Text, StyleSheet } from "react-native";

export const MutedWarning = () => {
  return (
    <View style={styles.mutedWarning}>
      <Text style={styles.mutedWarningText}>The group is currently muted</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  mutedWarning: {
    backgroundColor: "rgb(233, 137, 39)",
    padding: 5,
  },
  mutedWarningText: {
    fontWeight: "bold",
    fontSize: 14,
    textAlign: "center",
  },
});
