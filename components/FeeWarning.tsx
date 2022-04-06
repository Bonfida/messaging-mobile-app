import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useContactFees } from "../utils/jab";
import { GroupThread } from "../utils/web3/jab";

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

export const FeeWarningGroup = ({
  groupData,
}: {
  groupData: GroupThread | null | undefined;
}) => {
  if (!groupData?.lamportsPerMessage || groupData.lamportsPerMessage.eqn(0)) {
    return null;
  }
  return (
    <View style={styles.feeWarning}>
      <Text style={styles.feeWarningText}>
        This group requires{" "}
        {groupData.lamportsPerMessage.toNumber() / LAMPORTS_PER_SOL} SOL per
        message
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
