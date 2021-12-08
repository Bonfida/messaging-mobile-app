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

const PinkTextGradient = ({
  text,
  textStyle,
  maskStyle,
  start,
  end,
}: {
  text: string | undefined | null;
  textStyle: StyleProp<TextStyle>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        colors={["rgb(153, 79, 170)", "#B846B2"]}
        style={{ flex: 1 }}
        start={start ? start : defaultStart}
        end={end ? end : defaultEnd}
      />
    </MaskedView>
  );
};

export default PinkTextGradient;
