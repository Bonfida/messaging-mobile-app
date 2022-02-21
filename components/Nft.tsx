import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  TouchableOpacity,
  Share,
} from "react-native";
import { Metadata } from "../utils/nft/metadata";
import axios from "axios";
import { BottomSheet } from "react-native-btr";
import GlobalStyle from "../Style";
import BlueButton, { BlueButtonWhiteBg } from "./Buttons/BlueGradient";
import { URL_UPLOAD } from "../utils/ipfs";
import { IPost } from "../types";
import { Profile } from "../utils/web3/jabber";
import { setUserProfile, createProfile } from "@bonfida/jabber";
import { useConnection } from "../utils/connection";
import { useWallet } from "../utils/wallet.native";
import { balanceWarning } from "./BalanceWarning";
import { shortUrl } from "../utils/utils.native";
import { PublicKey } from "@solana/web3.js";

const Title = ({ title }: { title: string }) => {
  return (
    <View style={styles.title}>
      <Text style={styles.h2}>{title}</Text>
    </View>
  );
};

export const Nft = ({
  metadata,
  touchable,
}: {
  metadata: Metadata;
  touchable?: boolean;
}) => {
  const [image, setImage] = useState<null | string>(null);
  const [loading, setLoading] = useState(false);
  const width = Dimensions.get("window").width * 0.3;
  const [visible, setVisible] = useState(false);
  const [type, setType] = useState<string | null>(null);
  const connection = useConnection();
  const { wallet, sendTransaction, hasSol } = useWallet();

  useEffect(() => {
    const fn = async () => {
      const result = await axios.get(metadata.data.uri);
      // @ts-ignore
      setImage(result.data.image);
      try {
        // @ts-ignore
        setType(result.data.properties.files[0].type);
      } catch (err) {
        console.log(err);
      }
    };
    fn();
  }, []);

  const handleOnPress = () => {
    setVisible(true);
  };

  const handleOnPressConfirm = async () => {
    if (!wallet || !image || !type) return;
    if (!(await hasSol())) {
      balanceWarning(wallet.publicKey.toBase58());
    }
    try {
      setLoading(true);
      const len = Buffer.alloc(1);
      len.writeInt8(type.length, 0);

      const prefix = Buffer.concat([len, Buffer.from(type)]);

      // Check if user profile exists
      const response = await axios.get(image, {
        responseType: "arraybuffer",
      });

      // @ts-ignore
      const base64String = Buffer.from(response.data, "binary").toString(
        "base64"
      );

      const fileBuffer = Buffer.from(base64String, "base64");

      const message = Buffer.concat([prefix, fileBuffer]);
      const formData = new FormData();

      formData.append("file", JSON.stringify(Uint8Array.from(message)));

      const { data }: { data: IPost } = await axios.post(URL_UPLOAD, formData);

      const hash = data.Hash;

      // Check if profile exists
      try {
        const currentProfile = await Profile.retrieve(
          connection,
          wallet.publicKey
        );

        const instruction = await setUserProfile(
          hash,
          currentProfile.displayDomainName,
          currentProfile.bio,
          currentProfile.lamportsPerMessage.toNumber(),
          currentProfile.allowDm,
          wallet.publicKey
        );
        await sendTransaction({
          connection,
          signers: [],
          wallet,
          instruction: [instruction],
        });
      } catch {
        const createInstruction = await createProfile(
          wallet.publicKey,
          "",
          hash,
          "",
          0
        );
        await sendTransaction({
          connection,
          signers: [],
          wallet,
          instruction: [createInstruction],
        });
      }
      setVisible(false);
      setLoading(false);
    } catch (err) {
      setLoading(false);
      console.log(err);
    }
  };

  const onShare = async () => {
    try {
      const longUrl = `https://explorer.solana.com/address/${new PublicKey(
        metadata.mint
      ).toBase58()}/metadata`;
      const url = await shortUrl(longUrl);
      await Share.share({
        message: `Checkout my new NFT: ${metadata.data.name} ${url}`,
      });
    } catch (error) {
      // @ts-ignore
      alert(error.message);
    }
  };

  return (
    <>
      <TouchableOpacity disabled={!touchable} onPress={handleOnPress}>
        <View style={styles.container}>
          {image ? (
            <Image
              source={{ uri: image }}
              style={{ width: width, height: width }}
            />
          ) : (
            <ActivityIndicator />
          )}
          <Text style={styles.name}>{metadata.data.name}</Text>
        </View>
      </TouchableOpacity>
      {image && (
        <BottomSheet
          visible={visible}
          onBackButtonPress={() => setVisible(false)}
          onBackdropPress={() => setVisible(false)}
        >
          <View style={[styles.bottomNavigationView]}>
            <View style={styles.bottomContainer}>
              <Title title="Use as profile picture" />
            </View>

            <View style={styles.bottomSheetImg}>
              <Image
                source={{ uri: image }}
                style={{ width: width, height: width }}
              />
            </View>

            <View style={styles.button}>
              <BlueButtonWhiteBg
                borderRadius={28}
                width={120}
                height={56}
                onPress={onShare}
              >
                <Text style={{ ...styles.buttonText, color: "#60C0CB" }}>
                  Share
                </Text>
              </BlueButtonWhiteBg>
              <BlueButton
                borderRadius={28}
                width={120}
                height={56}
                onPress={handleOnPressConfirm}
                transparent
              >
                {loading ? (
                  <ActivityIndicator />
                ) : (
                  <Text style={styles.buttonText}>Confirm</Text>
                )}
              </BlueButton>
            </View>
          </View>
        </BottomSheet>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flexBasis: "40%",
    marginLeft: "5%",
    marginRight: "5%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  name: {
    marginTop: 10,
    maxWidth: 80,
    textAlign: "center",
    fontWeight: "500",
    marginBottom: 10,
  },
  bottomNavigationView: {
    width: "100%",
    height: 300,
    ...GlobalStyle.background,
  },
  title: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  h2: {
    ...GlobalStyle.h2,
    fontWeight: "bold",
  },
  bottomContainer: {
    width: "80%",
    marginLeft: "10%",
    marginRight: "10%",
    marginTop: "5%",
  },
  textInput: {
    backgroundColor: "#F0F5FF",
    borderRadius: 2,
    height: 40,
    width: 327,
    borderColor: "#9BA3B5",
    borderWidth: 1,
    padding: 10,
    marginTop: 10,
    color: "#2A2346",
  },
  strong: {
    fontWeight: "bold",
  },
  buttonText: {
    fontSize: 18,
    ...GlobalStyle.white,
  },
  button: {
    marginTop: 20,
    display: "flex",
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-around",
    marginRight: "10%",
    marginLeft: "10%",
  },
  bottomSheetImg: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
});
