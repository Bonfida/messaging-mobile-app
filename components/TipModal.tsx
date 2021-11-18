import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import {
  useFidaBalance,
  FIDA_MULTIPLIER,
  getAssociatedTokenAccount,
  FIDA_MINT,
  createTransferInstruction,
} from "../utils/tokens";
import { useWallet } from "../utils/wallet";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import { TWFWrapper } from "../utils/utils.native";
import { useConnection } from "../utils/connection";
import { isWeb } from "../utils/utils";
import { balanceWarning } from "./BalanceWarning";

export const TipModal = ({
  setVisible,
  contact,
}: {
  setVisible: (arg: boolean) => void;
  contact: string;
}) => {
  const connection = useConnection();
  const [tip, setTip] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const { wallet, sendTransaction, hasSol } = useWallet();
  const [refresh] = useState(false);
  const [fidaBalance] = useFidaBalance(wallet?.publicKey, refresh);

  const handleOnChangeText = (text: string) => {
    const parsed = parseFloat(text.trim());
    if (!parsed || parsed < 0 || isNaN(parsed) || !isFinite(parsed)) {
      return setTip(null);
    }
    setTip(parsed);
  };

  const handelOnPress = async () => {
    if (!tip || !wallet) return null;
    if (!fidaBalance || fidaBalance < tip) {
      return Alert.alert(
        "Insuficient funds",
        "You do not have enough FIDA in your wallet"
      );
    }
    if (!(await hasSol())) {
      return balanceWarning(wallet.publicKey.toBase58());
    }
    try {
      setLoading(true);
      const source = (
        await getAssociatedTokenAccount(wallet.publicKey, FIDA_MINT)
      )[0];
      const destination = (
        await getAssociatedTokenAccount(new PublicKey(contact), FIDA_MINT)
      )[0];
      const instr = createTransferInstruction(
        TOKEN_PROGRAM_ID,
        source,
        destination,
        wallet.publicKey,
        tip * FIDA_MULTIPLIER
      );
      const tx = await sendTransaction({
        connection,
        signers: [],
        wallet,
        instruction: [instr],
      });
      console.log(tx);
      setLoading(false);
      isWeb
        ? alert(`You have successfully sent ${tip} FIDA`)
        : Alert.alert("Success!", `You have successfully sent ${tip} FIDA`);
    } catch (err) {
      console.log(err);
      isWeb
        ? alert("Please try again")
        : Alert.alert("Error", "Please try again");
    }
  };

  return (
    <TWFWrapper>
      <View style={styles.safeArea}>
        <View style={styles.root}>
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="FIDA Amount "
            style={styles.input}
            onChangeText={handleOnChangeText}
            value={tip?.toLocaleString() || ""}
            keyboardType="decimal-pad"
          />
          <Text style={styles.text}>
            You can tip your contact with FIDA.{" "}
            {fidaBalance !== undefined && (
              <>You currently have {fidaBalance} FIDA in your wallet</>
            )}
          </Text>
        </View>

        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            disabled={loading}
            style={styles.buttonContainer}
            onPress={() => setVisible(false)}
          >
            <Text style={styles.buttonText}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity
            disabled={!tip || loading}
            style={styles.buttonContainer}
            onPress={handelOnPress}
          >
            {loading ? (
              <ActivityIndicator />
            ) : (
              <Text style={styles.buttonText}>Enter</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </TWFWrapper>
  );
};

const styles = StyleSheet.create({
  input: {
    backgroundColor: "white",
    padding: 15,
  },
  text: {
    fontSize: 14,
    margin: 20,
    opacity: 0.5,
  },
  img: {
    width: 90,
    height: 90,
  },
  imgContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "10%",
  },
  root: {
    marginTop: "30%",
  },
  buttonContainer: {
    margin: 20,
    elevation: 8,
    backgroundColor: "#007bff",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    width: "40%",
  },
  buttonText: {
    fontSize: 14,
    color: "#fff",
    fontWeight: "bold",
    alignSelf: "center",
    textTransform: "uppercase",
  },
  safeArea: {
    flex: 1,
    height: "100%",
    justifyContent: "space-between",
    backgroundColor: "rgb(240 ,240, 240)",
  },
  buttonsContainer: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
});
