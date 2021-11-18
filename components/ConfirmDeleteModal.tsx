import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { TWFWrapper } from "../utils/utils.native";

const Explanation = () => {
  return (
    <View style={styles.explanationContainer}>
      <Text style={styles.explanationRow}>
        ⚠️ This is a destructive action.
      </Text>
      <Text style={styles.explanationRow}>
        This will permanently delete your private key from this device
      </Text>
      <Text style={styles.explanationRow}>
        Please type <Text style={styles.strong}>delete</Text> to confirm.
      </Text>
    </View>
  );
};

const ConfirmDeleteModal = ({
  setVisible,
  deleteFn,
}: {
  setVisible: (arg: boolean) => void;
  deleteFn: () => void;
}) => {
  const [text, onChangeText] = useState<null | string>(null);
  const DELETE = "delete";

  const handleOnPress = () => {
    if (text != DELETE) {
      return alert("Invalid input");
    }
    deleteFn();
    setVisible(false);
  };

  return (
    <TWFWrapper>
      <View style={styles.safeArea}>
        <View style={styles.root}>
          <Explanation />
          <TextInput
            autoCapitalize="none"
            placeholder="delete"
            style={styles.input}
            onChangeText={onChangeText}
          />
        </View>
        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={styles.buttonContainer}
            onPress={() => setVisible(false)}
          >
            <Text style={styles.buttonText}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.buttonContainer}
            onPress={handleOnPress}
          >
            <Text style={styles.buttonText}>Enter</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TWFWrapper>
  );
};

export default ConfirmDeleteModal;

const styles = StyleSheet.create({
  input: {
    backgroundColor: "white",
    padding: 15,
  },
  strong: {
    fontWeight: "bold",
  },
  buttonsContainer: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    fontSize: 14,
    color: "#fff",
    fontWeight: "bold",
    alignSelf: "center",
    textTransform: "uppercase",
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
  safeArea: {
    flex: 1,
    height: "100%",
    justifyContent: "space-between",
    backgroundColor: "rgb(240 ,240, 240)",
  },
  root: {
    marginTop: "30%",
  },
  explanationContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  explanationRow: {
    marginBottom: 10,
    marginTop: 10,
  },
});
