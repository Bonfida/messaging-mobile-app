import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import React from "react";
import { StyleSheet, View, Text, SafeAreaView } from "react-native";
import { useProfileWs } from "../../utils/jabber";
import { useDisplayName } from "../../utils/name-service";
import ProfileCard from "./Card";
import { useGetIpfsData } from "../../utils/jabber";

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
    <SafeAreaView style={styles.root}>
      <ProfileCard
        domain={domain}
        address={contact}
        pic={pic}
        feeMsg={feeMsg}
      />
    </SafeAreaView>
  );
};

export default Profile;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-around",
  },
});
