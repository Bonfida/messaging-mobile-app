import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ImageProps,
  TextInput,
} from "react-native";
import { BottomSheet } from "react-native-btr";
import GlobalStyle from "../Style";
import BlueButton from "./Buttons/BlueGradient";

enum Step {
  DmOrGroup,
  Dm,
  Group,
}

const CloseIcon = ({ close }: { close: () => void }) => {
  return (
    <TouchableOpacity onPress={close}>
      <Image source={require("../assets/close.png")} />
    </TouchableOpacity>
  );
};

const Title = ({ title, close }: { title: string; close: () => void }) => {
  return (
    <View style={styles.title}>
      <Text style={styles.h2}>{title}</Text>
      <CloseIcon close={close} />
    </View>
  );
};

const Row = ({
  icon,
  label,
  handleOnPress,
}: {
  icon: ImageProps;
  label: string;
  handleOnPress: () => void;
}) => {
  return (
    <TouchableOpacity style={styles.row} onPress={handleOnPress}>
      <Image style={styles.img} source={icon} />
      <Text style={[GlobalStyle.text, { marginLeft: 20 }]}>{label}</Text>
    </TouchableOpacity>
  );
};

const NewChatBottomSheet = ({
  visible,
  setVisible,
}: {
  visible: boolean;
  setVisible: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const [step, setStep] = useState(Step.DmOrGroup);

  const close = () => {
    setStep(Step.DmOrGroup);
    setVisible((prev) => !prev);
  };

  return (
    <BottomSheet
      visible={visible}
      onBackButtonPress={close}
      onBackdropPress={close}
    >
      <View style={styles.bottomNavigationView}>
        <View style={styles.container}>
          {step === Step.DmOrGroup && (
            <>
              <Title title="New chat" close={close} />
              <Row
                icon={require("../assets/new-dm.png")}
                label="Direct message"
                handleOnPress={() => setStep(Step.Dm)}
              />
              <Row
                icon={require("../assets/new-group.png")}
                label="Group message"
                handleOnPress={() => setStep(Step.Group)}
              />
            </>
          )}
          {step === Step.Dm && (
            <>
              <Title title="Direct message" close={close} />
              <Text style={[GlobalStyle.text, { marginTop: 20 }]}>
                Enter the domain of your contact e.g. bonfida.sol
              </Text>
              <TextInput
                style={styles.textInput}
                placeholder="Domain e.g bonfida.sol"
                placeholderTextColor="#C8CCD6"
              />
              <View style={styles.button}>
                <BlueButton
                  borderRadius={28}
                  width={120}
                  height={56}
                  onPress={() => console.log("")}
                >
                  <Text style={styles.buttonText}>Search</Text>
                </BlueButton>
              </View>
            </>
          )}
        </View>
      </View>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  bottomNavigationView: {
    width: "100%",
    height: 250,
    ...GlobalStyle.background,
  },
  title: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  h2: {
    ...GlobalStyle.h2,
    fontWeight: "bold",
  },
  container: {
    width: "80%",
    marginLeft: "10%",
    marginRight: "10%",
    marginTop: "5%",
  },
  row: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    marginTop: 20,
  },
  img: {
    width: 40,
    height: 40,
  },
  textInput: {
    backgroundColor: "#181F2B",
    borderRadius: 2,
    height: 40,
    width: 327,
    borderColor: "#9BA3B5",
    borderWidth: 1,
    padding: 10,
    marginTop: 10,
    color: "#C8CCD6",
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "bold",
    ...GlobalStyle.blue,
  },
  button: {
    marginTop: 20,
    display: "flex",
    alignItems: "center",
  },
});

export default NewChatBottomSheet;
