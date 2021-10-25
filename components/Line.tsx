import React from "react";
import { StyleSheet, View } from "react-native";

export const Line = ({ width }: { width: number | string }) => {
  return (
    <View
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
      }}
    >
      <View style={{ ...styles.root, width }} />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    borderBottomWidth: 0.5,
    borderBottomColor: "#a6a6a6",
    marginTop: 10,
    marginBottom: 10,
  },
});
