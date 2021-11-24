import React, { useState } from "react";
import {
  SafeAreaView,
  Text,
  ActivityIndicator,
  StyleSheet,
  View,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { useChangeConnectionUrl, useConnection } from "../utils/connection";
import { RPC_URL } from "@env";
import { TWFWrapper } from "../utils/utils.native";
import { useNavigation } from "@react-navigation/core";

const ChangeRpcScreen = () => {
  const [loading, setLoading] = useState(false);
  const [newUrl, setNewUrl] = useState<null | string>(null);
  const changeUrl = useChangeConnectionUrl();
  const navigation = useNavigation();

  const handleOnPressReset = async () => {
    try {
      setLoading(true);
      await changeUrl(RPC_URL);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOnPressChange = async () => {
    try {
      setLoading(true);
      if (!newUrl || !newUrl.startsWith("https://")) {
        return alert("Invalid URL");
      }
      await changeUrl(newUrl);
      setLoading(false);
      navigation.goBack();
    } catch (err) {
      alert("Invalid URL - Try again");
      console.log(err);
      setLoading(false);
    }
  };

  return (
    <TWFWrapper>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.root}>
          <Text style={styles.title}>Change RPC endpoint</Text>
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.input}
            onChangeText={setNewUrl}
            placeholder="New RPC endpoint"
          />
          <Text style={styles.text}>Enter a valid RPC endpoint URL</Text>
        </View>

        <View>
          <TouchableOpacity
            disabled={loading || !newUrl}
            style={styles.buttonContainer}
            onPress={handleOnPressChange}
          >
            {loading ? (
              <ActivityIndicator />
            ) : (
              <Text style={styles.buttonText}>Enter</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            disabled={loading}
            style={styles.buttonContainer}
            onPress={handleOnPressReset}
          >
            {loading ? (
              <ActivityIndicator />
            ) : (
              <Text style={styles.buttonText}>Reset</Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </TWFWrapper>
  );
};

export default ChangeRpcScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    height: "100%",
    justifyContent: "space-between",
  },
  root: {
    marginTop: "10%",
  },
  input: {
    backgroundColor: "white",
    padding: 15,
  },
  text: {
    fontSize: 14,
    marginLeft: 20,
    marginTop: 10,
    marginBottom: 20,
    opacity: 0.5,
  },
  buttonContainer: {
    margin: 5,
    elevation: 8,
    backgroundColor: "#007bff",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  buttonText: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "bold",
    alignSelf: "center",
    textTransform: "uppercase",
  },
  title: {
    textTransform: "uppercase",
    opacity: 0.5,
    marginLeft: 20,
    marginBottom: 5,
    marginTop: 10,
  },
});
