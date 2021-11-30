import React from "react";
import { StyleSheet, SafeAreaView, Text } from "react-native";
import GradientCard from "../Cards/GradientCard";
import { IStep } from "../../types";

export const WalletAddress = ({
  setStep,
}: {
  setStep: React.Dispatch<React.SetStateAction<IStep>>;
}) => {
  return (
    <SafeAreaView>
      <GradientCard borderRadius={20} height={200} width={300}>
        <Text></Text>
      </GradientCard>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({});
