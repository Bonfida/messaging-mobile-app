import React from "react";
import { View, Text, StyleSheet } from "react-native";
import GloablStyle from "../../Style";

export const Row = ({
  label,
  value,
}: {
  label?: React.ReactNode;
  value?: React.ReactNode;
}) => {
  return (
    <View style={styles.row}>
      <Text numberOfLines={1} ellipsizeMode="tail" style={styles.label}>
        {label}
      </Text>
      <Text numberOfLines={1} ellipsizeMode="tail" style={styles.value}>
        {value}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  label: {
    ...GloablStyle.darkBlue,
    fontSize: 18,
  },
  value: {
    ...GloablStyle.darkBlue,
  },
  row: {
    marginTop: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexDirection: "row",
    padding: 15,
  },
});
