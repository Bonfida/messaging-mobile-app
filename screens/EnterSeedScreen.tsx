import React, { useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  StyleSheet,
  Button,
  ActivityIndicator,
  Alert,
  Linking,
} from "react-native";
import {
  useWallet,
  loadKeyPairFromMnemonicOrPrivateKey,
} from "../utils/wallet";
import { useConnection } from "../utils/connection";
import { ownerHasDomain } from "../utils/name-service";
import HelpsUrls from "../utils/HelpUrls";
import * as SecureStore from "expo-secure-store";
import "text-encoding-polyfill";

const EnterSeedScreen = () => {
  const connection = useConnection();
  const [mnemonic, setMnemonic] = useState<null | string>(null);
  const [loading, setLoading] = useState(false);
  const { refresh } = useWallet();

  const handleOnPress = async () => {
    if (!mnemonic) {
      return alert("Please enter your seed");
    }
    try {
      setLoading(true);
      const [account, normalized] = await loadKeyPairFromMnemonicOrPrivateKey(
        mnemonic
      );
      if (!account || !normalized) {
        return alert("Invalid input");
      }
      const hasDomain = await ownerHasDomain(connection, account.publicKey);

      if (!hasDomain) {
        return Alert.alert(
          "No domain found",
          "You don't have a Solana domain or a registered Twitter handle",
          [
            {
              text: "Close",
              style: "cancel",
            },
            {
              text: "Get one",
              onPress: () => Linking.openURL(HelpsUrls.buyDomain),
            },
          ]
        );
      }

      await SecureStore.setItemAsync("mnemonic", normalized);
      refresh();
    } catch (err) {
      console.log(err);
      alert("Invalid seeds");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <View>
        <Text style={styles.text}>
          Restore your wallet using your twenty-four seed words or private key.{" "}
        </Text>
        <TextInput style={styles.input} onChangeText={setMnemonic} />
        {loading ? (
          <ActivityIndicator />
        ) : (
          <Button disabled={!mnemonic} title="Next" onPress={handleOnPress} />
        )}
      </View>
    </SafeAreaView>
  );
};

export default EnterSeedScreen;

const styles = StyleSheet.create({
  root: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  text: {
    textAlign: "center",
    fontSize: 16,
    marginLeft: 10,
    marginRight: 10,
  },
  input: {
    height: 40,
    margin: 12,
    borderWidth: 1,
    padding: 10,
  },
});
