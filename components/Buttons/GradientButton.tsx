import React from "react";
import {
  TouchableOpacity,
  GestureResponderEvent,
  StyleProp,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

const GradientButton = ({
  onPress,
  children,
  borderRadius,
  width,
  height,
  style,
  disabled,
}: {
  onPress: ((event: GestureResponderEvent) => void) | undefined;
  children: React.ReactNode;
  borderRadius: number;
  width: number;
  height: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  style?: StyleProp<any>;
  disabled?: boolean;
}) => {
  return (
    <TouchableOpacity disabled={disabled} onPress={onPress} style={style}>
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
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {children}
        </LinearGradient>
      </LinearGradient>
    </TouchableOpacity>
  );
};

export default GradientButton;
