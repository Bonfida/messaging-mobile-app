import React, { useState } from "react";
import { TextInput, StyleSheet, View, Text } from "react-native";
import { BottomSheet } from "react-native-btr";
import GlobalStyle from "../Style";
import { useKeyBoardOffset } from "../utils/utils.native";
import BlueButton from "./Buttons/BlueGradient";

const Title = ({ title, close }: { title: string; close: () => void }) => {
  return (
    <View style={styles.title}>
      <Text style={styles.h2}>{title}</Text>
    </View>
  );
};

const ConfirmDeleteBottomSheet = ({
  visible,
  setVisible,
  deleteFn,
}: {
  deleteFn: () => void;
  visible: boolean;
  setVisible: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const [text, onChangeText] = useState<null | string>(null);
  const keyboardOffset = useKeyBoardOffset();
  const DELETE = "delete";

  const handleOnPress = () => {
    if (text != DELETE) {
      return alert("Invalid input");
    }
    deleteFn();
    setVisible(false);
  };

  return (
    <BottomSheet
      visible={visible}
      onBackButtonPress={() => setVisible(false)}
      onBackdropPress={() => setVisible(false)}
    >
      <View
        style={[styles.bottomNavigationView, { marginBottom: keyboardOffset }]}
      >
        <View style={styles.container}>
          <Title
            title="⚠️ This is a destructive action."
            close={() => setVisible(false)}
          />
          <Text style={[GlobalStyle.text, { marginTop: 20 }]}>
            This will permanently delete your private key from this device
          </Text>
          <Text style={[GlobalStyle.text, { marginTop: 20 }]}>
            Please type <Text style={styles.strong}>delete</Text> to confirm.
          </Text>
          <TextInput
            autoCapitalize="none"
            placeholder="delete"
            style={styles.textInput}
            placeholderTextColor="#C8CCD6"
            onChangeText={onChangeText}
          />
        </View>
        <View style={styles.button}>
          <BlueButton
            borderRadius={28}
            width={120}
            height={56}
            onPress={handleOnPress}
          >
            <Text style={styles.buttonText}>Search</Text>
          </BlueButton>
        </View>
      </View>
    </BottomSheet>
  );
};

export default ConfirmDeleteBottomSheet;

const styles = StyleSheet.create({
  bottomNavigationView: {
    width: "100%",
    height: 300,
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
  strong: {
    fontWeight: "bold",
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
