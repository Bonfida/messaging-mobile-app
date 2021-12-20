import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { useWallet } from "../utils/wallet.native";
import { useNft } from "../utils/nft/metadata";
import { Nft } from "../components/Nft";

const GalleryScreen = () => {
  const { wallet } = useWallet();
  const nfts = useNft(wallet?.publicKey);
  if (!nfts) {
    return null;
  }

  return (
    <ScrollView>
      <View style={styles.row}>
        {nfts.map((_, idx) => {
          return (
            <Nft metadata={nfts[idx].metadata} key={`nft-${idx}`} touchable />
          );
        })}
      </View>
    </ScrollView>
  );
};

export default GalleryScreen;

const styles = StyleSheet.create({
  row: {
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
