import React from "react";
import { LinearGradient } from "expo-linear-gradient";
import { View } from "react-native";

const LightGradientCard = ({
  children,
  borderRadius,
  width,
  height,
}: {
  children: React.ReactNode;
  borderRadius: number;
  width: number | string;
  height: number | string;
}) => {
  return (
    <View>
      <LinearGradient
        colors={["#8585FD", "#7049AE"]}
        end={{ x: 1, y: 1 }}
        start={{ x: 0, y: 0 }}
        style={{
          width,
          height,
          borderRadius: borderRadius,
          padding: 2,
        }}
      >
        {children}
      </LinearGradient>
    </View>
  );
};

export default LightGradientCard;
