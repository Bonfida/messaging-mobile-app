import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Linking,
  Alert,
  ActivityIndicator,
} from "react-native";
import { BottomSheet } from "react-native-btr";
import GlobalStyle from "../../Style";
import HelpsUrls from "../../utils/HelpUrls";
import { useFidaBalance } from "../../utils/tokens";
import { useWallet } from "../../utils/wallet.native";
import BlueButton from "./../Buttons/BlueGradient";
import GradientButton from "./../Buttons/GradientButton";
import { tip } from "../../utils/tokens";
import { useConnection } from "../../utils/connection";
import { PublicKey } from "@solana/web3.js";
import { useKeyBoardOffset } from "../../utils/utils.native";

const Button = ({
  amount,
  selectedAmount,
  setSelectedAmount,
}: {
  amount: FidaAmount;
  selectedAmount: FidaAmount;
  setSelectedAmount: React.Dispatch<React.SetStateAction<FidaAmount>>;
}) => {
  if (amount === selectedAmount) {
    return (
      <GradientButton
        height={40}
        width={72.75}
        borderRadius={4}
        onPress={() => setSelectedAmount(amount)}
      >
        <Text style={styles.buttonText}>{amount}</Text>
      </GradientButton>
    );
  }
  return (
    <BlueButton
      height={40}
      width={72.75}
      borderRadius={4}
      onPress={() => setSelectedAmount(amount)}
    >
      <Text style={styles.buttonText}>{amount}</Text>
    </BlueButton>
  );
};

enum FidaAmount {
  One = 1,
  Five = 5,
  Ten = 10,
  Custom = "Custom",
}

const TipBottomSheet = ({
  visible,
  setVisible,
  contact,
}: {
  visible: boolean;
  setVisible: React.Dispatch<React.SetStateAction<boolean>>;
  contact: string;
}) => {
  const connection = useConnection();
  const [loading, setLoading] = useState(false);
  const { wallet, sendTransaction } = useWallet();
  const [selectedAmount, setSelectedAmount] = useState(FidaAmount.One);
  const [custom, setCustom] = useState<string | null>(null);
  const [fidaBalance] = useFidaBalance(wallet?.publicKey, true);
  const keyboardOffset = useKeyBoardOffset();

  const close = () => {
    setVisible((prev) => !prev);
  };

  const handleSend = async () => {
    if (!fidaBalance || !wallet) return;
    if (!custom && selectedAmount === FidaAmount.Custom) return;

    const parsedAmount =
      selectedAmount === FidaAmount.Custom
        ? parseFloat(custom!)
        : selectedAmount;

    if (parsedAmount > fidaBalance) {
      return Alert.alert(
        "Low balances",
        "You don't have enough FIDA in your wallet"
      );
    }

    if (parsedAmount <= 0) {
      return Alert.alert("Invalid input", "FIDA amount must be > 0");
    }

    try {
      setLoading(true);
      const instructions = await tip(
        connection,
        wallet.publicKey,
        new PublicKey(contact),
        parsedAmount
      );
      const tx = await sendTransaction({
        connection,
        instruction: instructions,
        signers: [],
        wallet,
      });
      console.log(tx);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <BottomSheet
      visible={visible}
      onBackButtonPress={close}
      onBackdropPress={close}
    >
      <View style={styles.bottomNavigationView}>
        <View style={styles.container}>
          <Text style={GlobalStyle.h2}>Send a tip</Text>
          <Text style={GlobalStyle.text}>
            Tip your contact with FIDA. Don’t have FIDA? No problem buy some
            <Text
              onPress={() => Linking.openURL(HelpsUrls.buyFida)}
              style={GlobalStyle.blue}
            >
              {" "}
              here.
            </Text>
          </Text>
        </View>
        <View style={styles.buttonSection}>
          <Button
            setSelectedAmount={setSelectedAmount}
            amount={FidaAmount.One}
            selectedAmount={selectedAmount}
          />
          <Button
            setSelectedAmount={setSelectedAmount}
            amount={FidaAmount.Five}
            selectedAmount={selectedAmount}
          />
          <Button
            setSelectedAmount={setSelectedAmount}
            amount={FidaAmount.Ten}
            selectedAmount={selectedAmount}
          />
          <Button
            setSelectedAmount={setSelectedAmount}
            amount={FidaAmount.Custom}
            selectedAmount={selectedAmount}
          />
        </View>
        {selectedAmount === FidaAmount.Custom && (
          <View style={styles.inputContainer}>
            <TextInput
              onChangeText={setCustom}
              style={[styles.textInput, { marginBottom: keyboardOffset }]}
              placeholder="Amount"
              placeholderTextColor="#C8CCD6"
            />
          </View>
        )}
        <View style={styles.sendContainer}>
          <BlueButton
            disabled={loading}
            width={157}
            height={56}
            borderRadius={28}
            onPress={handleSend}
          >
            {loading ? (
              <ActivityIndicator />
            ) : (
              <Text style={styles.buttonText}>Send the tip</Text>
            )}
          </BlueButton>
        </View>
      </View>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  bottomNavigationView: {
    width: "100%",
    height: 350,
    ...GlobalStyle.background,
    display: "flex",
    justifyContent: "space-around",
  },
  container: {
    width: "80%",
    marginLeft: "10%",
    marginRight: "10%",
    marginTop: "5%",
  },
  buttonText: {
    fontWeight: "bold",
    fontSize: 16,
    ...GlobalStyle.blue,
  },
  buttonSection: {
    width: "80%",
    marginLeft: "10%",
    marginRight: "10%",
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  textInput: {
    backgroundColor: "#181F2B",
    borderRadius: 2,
    height: 40,
    width: 327,
    borderColor: "#9BA3B5",
    borderWidth: 1,
    padding: 10,
    color: "#C8CCD6",
  },
  inputContainer: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  sendContainer: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
});

export default TipBottomSheet;
