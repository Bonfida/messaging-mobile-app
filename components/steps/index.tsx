import React from "react";
import { StyleSheet, View } from "react-native";

export const Step = ({ selected }: { selected: boolean }) => {
  if (selected) {
    return <View style={styles.selected} />;
  }
  return <View style={styles.unselected} />;
};

const styles = StyleSheet.create({
  selected: {
    width: 79,
    height: 3,
    borderRadius: 3,
    backgroundColor: "#7C7CFF",
    margin: 5,
  },
  unselected: {
    width: 79,
    height: 3,
    borderRadius: 3,
    backgroundColor: "#9BA3B5",
    margin: 5,
  },
});
