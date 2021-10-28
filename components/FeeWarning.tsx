import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useContactFees } from "../utils/jabber";

export const FeeWarning = ({ contact }: { contact: string }) => {
  const contactFee = useContactFees(contact);

  if (!contactFee) {
    return null;
  }

  return (
    <View style={styles.feeWarning}>
      <Text style={styles.feeWarningText}>
        Your contact requires {contactFee} SOL per message
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  feeWarning: {
    backgroundColor: "rgb(233, 137, 39)",
    padding: 5,
  },
  feeWarningText: {
    fontWeight: "bold",
    fontSize: 14,
    textAlign: "center",
  },
});
