import React from "react";
import { View, Text, StyleSheet } from "react-native";

export const Row = ({
  label,
  value,
}: {
  label?: React.ReactNode;
  value?: React.ReactNode;
}) => {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  label: {
    fontWeight: "bold",
  },
  value: {
    opacity: 0.7,
  },
  row: {
    marginTop: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexDirection: "row",
    backgroundColor: "white",
    padding: 15,
  },
});
