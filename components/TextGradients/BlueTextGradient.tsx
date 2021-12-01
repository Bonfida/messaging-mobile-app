import React from "react";
import { StyleProp, TextStyle, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import MaskedView from "@react-native-masked-view/masked-view";

interface IStart {
  x: number;
  y: number;
}

const defaultStart: IStart = { x: 0, y: 0 };

interface IEnd {
  x: number;
  y: number;
}

const defaultEnd: IEnd = { x: 1, y: 1 };

const BlueTextGradient = ({
  text,
  textStyle,
  maskStyle,
  start,
  end,
}: {
  text: string | undefined | null;
  textStyle: StyleProp<TextStyle>;
  maskStyle: StyleProp<any>;
  start?: IStart;
  end?: IEnd;
}) => {
  return (
    <MaskedView
      style={maskStyle}
      maskElement={<Text style={textStyle}>{text}</Text>}
    >
      <LinearGradient
        colors={["#60C0CB", "#6868FC"]}
        style={{ flex: 1 }}
        start={start ? start : defaultStart}
        end={end ? end : defaultEnd}
      />
    </MaskedView>
  );
};

export default BlueTextGradient;
