import React from "react";
import { LinearGradient } from "expo-linear-gradient";
import { View } from "react-native";

const GradientCard = ({
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
    <View
      style={{
        shadowColor: "rgba(255, 255, 255, 0.25)",
        shadowOffset: {
          width: 0,
          height: 12,
        },
        shadowOpacity: 0.58,
        shadowRadius: 16.0,
        elevation: 24,
      }}
    >
      <LinearGradient
        colors={["#37BCBD", "#B846B2"]}
        end={{ x: 1, y: 1 }}
        start={{ x: 0, y: 0 }}
        style={{
          width,
          height,
          borderRadius: borderRadius,
          padding: 2,
        }}
      >
        <LinearGradient
          colors={["#131E30", "#0F0F11"]}
          end={{ x: 1, y: 1 }}
          start={{ x: 0.5, y: 0.5 }}
          style={{
            width: "100%",
            height: "100%",
            borderRadius: borderRadius - 2,
          }}
        >
          {children}
        </LinearGradient>
      </LinearGradient>
    </View>
  );
};

export default GradientCard;
