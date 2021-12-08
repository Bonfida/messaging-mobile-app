import React, { useState } from "react";
import {
  TextInput,
  StyleSheet,
  View,
  Text,
  ActivityIndicator,
} from "react-native";
import { BottomSheet } from "react-native-btr";
import GlobalStyle from "../Style";
import { useKeyBoardOffset } from "../utils/utils.native";
import BlueButton, { BlueButtonWhiteBg } from "./Buttons/BlueGradient";
import { useChangeConnectionUrl } from "../utils/connection";
// @ts-ignore
import { RPC_URL } from "@env";
import { useNavigation } from "@react-navigation/core";

const Title = ({ title }: { title: string }) => {
  return (
    <View style={styles.title}>
      <Text style={styles.h2}>{title}</Text>
    </View>
  );
};

const ChangeRpcBottomSheet = ({
  visible,
  setVisible,
}: {
  visible: boolean;
  setVisible: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const [newUrl, setNewUrl] = useState<null | string>(null);
  const keyboardOffset = useKeyBoardOffset();
  const [loading, setLoading] = useState(false);
  const changeUrl = useChangeConnectionUrl();

  const navigation = useNavigation();

  const handleOnPressReset = async () => {
    try {
      setLoading(true);
      await changeUrl(RPC_URL);
      setVisible(false);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOnPressChange = async () => {
    try {
      if (!newUrl || !newUrl.startsWith("https://")) {
        return alert("Invalid URL");
      }
      setLoading(true);
      await changeUrl(newUrl);
      setLoading(false);
      setVisible(false);
      navigation.goBack();
    } catch (err) {
      alert("Invalid URL - Try again");
      console.log(err);
      setLoading(false);
    }
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
          <Title title="Change RPC endpoint" />
          <TextInput
            autoCapitalize="none"
            placeholder="New RPC endpoint e.g https://solana-api.projectserum.com"
            style={styles.textInput}
            placeholderTextColor="#C8CCD6"
            onChangeText={setNewUrl}
          />
        </View>
        <View style={styles.button}>
          <BlueButtonWhiteBg
            borderRadius={28}
            width={120}
            height={56}
            onPress={handleOnPressReset}
          >
            <Text style={{ ...styles.buttonText, color: "#60C0CB" }}>
              Reset
            </Text>
          </BlueButtonWhiteBg>
          <BlueButton
            borderRadius={28}
            width={120}
            height={56}
            onPress={handleOnPressChange}
            transparent
          >
            {loading ? (
              <ActivityIndicator />
            ) : (
              <Text style={styles.buttonText}>Confirm</Text>
            )}
          </BlueButton>
        </View>
      </View>
    </BottomSheet>
  );
};

export default ChangeRpcBottomSheet;

const styles = StyleSheet.create({
  bottomNavigationView: {
    width: "100%",
    height: 200,
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
    backgroundColor: "#F0F5FF",
    borderRadius: 2,
    height: 40,
    width: 327,
    borderColor: "#9BA3B5",
    borderWidth: 1,
    padding: 10,
    marginTop: 10,
    color: "#2A2346",
  },
  strong: {
    fontWeight: "bold",
  },
  buttonText: {
    fontSize: 18,
    ...GlobalStyle.white,
  },
  button: {
    marginTop: 20,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-around",
    width: "80%",
    marginLeft: "10%",
    marginRight: "10%",
    flexDirection: "row",
  },
});
