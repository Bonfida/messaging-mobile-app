import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import React, { useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { TipModal } from "../components/TipModal";
import { ProfileRow } from "../components/Profile/ProfileRow";
import { Row } from "../components/Profile/Row";
import { useProfileWs } from "../utils/jabber";
import { abbreviateAddress, roundToDecimal } from "../utils/utils.native";
import { FontAwesome5, Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/core";
import { messageScreenProp } from "../types";
import { RootStackParamList } from "../App";
import { RouteProp } from "@react-navigation/native";
import Modal from "../components/Modal";
import * as Clipboard from "expo-clipboard";
import { useDisplayName } from "../utils/name-service";
import Profile from "../components/Profile";

const MessageButton = ({ contact }: { contact: string }) => {
  const navigation = useNavigation<messageScreenProp>();

  const handleOnPress = () => {
    navigation.navigate("Message", { contact: contact });
  };

  return (
    <TouchableOpacity style={styles.button} onPress={handleOnPress}>
      <Feather
        name="message-circle"
        size={24}
        color="black"
        style={styles.icon}
      />
      <Text style={styles.buttonText}>Message</Text>
    </TouchableOpacity>
  );
};

const TipButton = ({ contact }: { contact: string }) => {
  const [visible, setVisible] = useState(false);
  return (
    <TouchableOpacity style={styles.button} onPress={() => setVisible(true)}>
      <FontAwesome5
        name="gratipay"
        size={24}
        color="black"
        style={styles.icon}
      />
      <Text style={styles.buttonText}>Send a tip</Text>
      {visible && (
        <Modal animationType="fade" transparent={true} visible={visible}>
          <TipModal setVisible={setVisible} contact={contact} />
        </Modal>
      )}
    </TouchableOpacity>
  );
};

const ProfileScreen = ({
  route,
}: {
  route: RouteProp<RootStackParamList, "Profile">;
}) => {
  const { contact } = route.params;

  return <Profile contact={contact} />;
};

export default ProfileScreen;

const styles = StyleSheet.create({
  button: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 0.5,
    marginLeft: "10%",
    marginRight: "10%",
    padding: 15,
    marginTop: 20,
  },
  buttonText: {
    textTransform: "uppercase",
    marginLeft: 10,
    fontWeight: "bold",
    opacity: 0.6,
  },
  icon: {
    opacity: 0.6,
  },
  root: {
    marginTop: "10%",
  },
});
