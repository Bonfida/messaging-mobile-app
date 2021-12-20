import React, { useState } from "react";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { StyleSheet, View, Text, ScrollView } from "react-native";
import { useProfileWs } from "../../utils/jabber";
import { useDisplayName } from "../../utils/name-service";
import ProfileCard from "./Card";
import { useGetIpfsData } from "../../utils/jabber";
import GlobalStyle from "../../Style";
import BlueButton, { BlueButtonWhiteBg } from "../Buttons/BlueGradient";
import TipBottomSheet from "./TipBottomSheet";
import { useNavigation } from "@react-navigation/core";
import { messageScreenProp } from "../../types";
import { useNft } from "../../utils/nft/metadata";
import { Nft } from "../Nft";

const MessageButton = ({ contact }: { contact: string }) => {
  const navigation = useNavigation<messageScreenProp>();

  const handleOnPress = () => {
    navigation.navigate("Message", { contact: contact });
  };
  return (
    <BlueButton
      style={styles.buttonStyle}
      onPress={handleOnPress}
      width={155.5}
      height={56}
      borderRadius={28}
      transparent
    >
      <Text style={[GlobalStyle.white, styles.buttonText]}>Message</Text>
    </BlueButton>
  );
};

const TipButton = ({ contact }: { contact: string }) => {
  const [visible, setVisible] = useState(false);
  return (
    <>
      <BlueButtonWhiteBg
        style={styles.buttonStyle}
        onPress={() => setVisible(true)}
        width={155.5}
        height={56}
        borderRadius={28}
      >
        <Text style={[GlobalStyle.blue, styles.buttonText]}>Send a tip</Text>
      </BlueButtonWhiteBg>
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
  const nfts = useNft(new PublicKey(contact));

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
    <ScrollView>
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
          <ButtonSection contact={contact} />
          {!!nfts && nfts.length > 0 && (
            <>
              <View style={styles.profileContainer}>
                <Text style={GlobalStyle.h1}>Gallery</Text>
                <View style={styles.nftRow}>
                  {nfts.map((_, idx) => {
                    return (
                      <Nft metadata={nfts[idx].metadata} key={`nft-${idx}`} />
                    );
                  })}
                </View>
              </View>
            </>
          )}
        </View>
      </View>
    </ScrollView>
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
  nftRow: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-start",
    flex: 1,
    flexWrap: "wrap",
    marginBottom: 20,
    marginTop: 20,
  },
});
