import React, { useState } from "react";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { StyleSheet, View, Text, SafeAreaView } from "react-native";
import { useProfileWs } from "../../utils/jabber";
import { useDisplayName } from "../../utils/name-service";
import ProfileCard from "./Card";
import { useGetIpfsData } from "../../utils/jabber";
import GlobalStyle from "../../Style";
import BlueButton from "../Buttons/BlueGradient";
import GradientButton from "../Buttons/GradientButton";
import TipBottomSheet from "./TipBottomSheet";
import { useNavigation } from "@react-navigation/core";
import { messageScreenProp } from "../../types";

const MessageButton = ({ contact }: { contact: string }) => {
  const navigation = useNavigation<messageScreenProp>();

  const handleOnPress = () => {
    navigation.navigate("Message", { contact: contact });
  };
  return (
    <GradientButton
      style={styles.buttonStyle}
      onPress={handleOnPress}
      width={155.5}
      height={56}
      borderRadius={28}
    >
      <Text style={[GlobalStyle.blue, styles.buttonText]}>Message</Text>
    </GradientButton>
  );
};

const TipButton = ({ contact }: { contact: string }) => {
  const [visible, setVisible] = useState(false);
  return (
    <>
      <BlueButton
        style={styles.buttonStyle}
        onPress={() => setVisible(true)}
        width={155.5}
        height={56}
        borderRadius={28}
      >
        <Text style={[GlobalStyle.blue, styles.buttonText]}>Send a tip</Text>
      </BlueButton>
      <TipBottomSheet
        contact={contact}
        visible={visible}
        setVisible={setVisible}
      />
    </>
  );
};

const ButtonSection = ({ contact }: { contact: string }) => {
  return (
    <View style={styles.buttonSection}>
      <TipButton contact={contact} />
      <MessageButton contact={contact} />
    </View>
  );
};

const Profile = ({ contact }: { contact: string }) => {
  const profile = useProfileWs(new PublicKey(contact));
  const [displayName] = useDisplayName(contact);

  const favoriteDisplayName = profile?.name?.split(":fdn:")[1];
  const profilePicHash = profile?.name?.split(":fdn:")[0];

  const feeMsg = profile?.lamportsPerMessage.toNumber()
    ? profile?.lamportsPerMessage.toNumber() / LAMPORTS_PER_SOL
    : 0;

  const pic = useGetIpfsData(profilePicHash);

  const domain = favoriteDisplayName
    ? favoriteDisplayName
    : displayName
    ? displayName[0]
    : contact;

  return (
    <View style={styles.container}>
      <View>
        <ProfileCard
          domain={domain}
          address={contact}
          pic={pic}
          feeMsg={feeMsg}
        />
        {!!profile?.bio && (
          <View style={styles.profileContainer}>
            <Text style={GlobalStyle.h1}>About</Text>
            <Text style={GlobalStyle.text}>{profile?.bio}</Text>
          </View>
        )}
      </View>
      <ButtonSection contact={contact} />
    </View>
  );
};

export default Profile;

const styles = StyleSheet.create({
  buttonSection: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  buttonStyle: {
    margin: 10,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  container: {
    flex: 1,
    display: "flex",
    justifyContent: "space-around",
    width: "90%",
    marginTop: 10,
    marginLeft: "5%",
    marginRight: "5%",
  },
  profileContainer: {
    marginTop: 20,
  },
});
