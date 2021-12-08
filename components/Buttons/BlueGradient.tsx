import React from "react";
import {
  TouchableOpacity,
  GestureResponderEvent,
  StyleProp,
  View,
  StyleSheet,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

const BlueButton = ({
  onPress,
  children,
  borderRadius,
  width,
  height,
  style,
  disabled,
  transparent,
}: {
  onPress: ((event: GestureResponderEvent) => void) | undefined;
  children: React.ReactNode;
  borderRadius: number;
  width: number;
  height: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  style?: StyleProp<any>;
  disabled?: boolean;
  transparent?: boolean;
}) => {
  const _children = transparent ? (
    <View style={styles.center}>{children}</View>
  ) : (
    <LinearGradient
      colors={["#131E30", "#0F0F11"]}
      end={{ x: 1, y: 1 }}
      start={{ x: 0.5, y: 0.5 }}
      style={{
        ...styles.center,
        borderRadius: borderRadius - 2,
      }}
    >
      {children}
    </LinearGradient>
  );

  return (
    <TouchableOpacity disabled={disabled} onPress={onPress} style={style}>
      <LinearGradient
        colors={["#60C0CB", "#6868FC"]}
        end={{ x: 1, y: 1 }}
        start={{ x: 0, y: 0 }}
        style={{
          width,
          height,
          borderRadius: borderRadius,
          padding: 2,
        }}
      >
        {_children}
      </LinearGradient>
    </TouchableOpacity>
  );
};

export default BlueButton;

export const BlueButtonWhiteBg = ({
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
  transparent?: boolean;
}) => {
  return (
    <TouchableOpacity disabled={disabled} onPress={onPress} style={style}>
      <LinearGradient
        colors={["#60C0CB", "#6868FC"]}
        end={{ x: 1, y: 1 }}
        start={{ x: 0, y: 0 }}
        style={{
          width,
          height,
          borderRadius: borderRadius,
          padding: 2,
        }}
      >
        <View
          style={{
            ...styles.center,
            ...styles.whiteBg,
            borderRadius: borderRadius - 2,
          }}
        >
          {children}
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  center: {
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  whiteBg: {
    backgroundColor: "#FFFFFF",
  },
});
