import React from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";

export const LoadingScreen = () => {
  return (
    <View style={styles.loadingScreen}>
      <ActivityIndicator />
    </View>
  );
};

const styles = StyleSheet.create({
  loadingScreen: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
});
