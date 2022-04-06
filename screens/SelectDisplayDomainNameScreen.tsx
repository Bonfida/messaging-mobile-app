import React, { useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useDisplayName } from "../utils/name-service";
import { useWallet } from "../utils/wallet.native";
import { Row } from "../components/Profile/Row";
import { Feather } from "@expo/vector-icons";
import { useConnection } from "../utils/connection";
import { Profile } from "../utils/web3/jab";
import { setUserProfile } from "../utils/web3/jab";
import { sleep } from "../utils/utils.native";
import { RouteProp } from "@react-navigation/native";
import { RootStackParamList } from "../App";
import { useNavigation } from "@react-navigation/core";
import GlobalStyle from "../Style";

const SelectDisplayDomainNameScreen = ({
  route,
}: {
  route: RouteProp<RootStackParamList, "Select Display Domain">;
}) => {
  const { selectedDomain } = route.params;
  const [loading, setLoading] = useState(false);
  const { wallet, sendTransaction } = useWallet();
  const [displayNames] = useDisplayName(wallet?.publicKey.toBase58());
  const connection = useConnection();
  const navigation = useNavigation();

  const handleOnPress = (domain: string) => async () => {
    if (!wallet) return;
    try {
      setLoading(true);
      const { name, bio, lamportsPerMessage } = await Profile.retrieve(
        connection,
        wallet.publicKey
      );

      const stripped = name.split(":fdn:")[0];

      const instruction = await setUserProfile(
        wallet.publicKey,
        stripped + ":fdn:" + domain,
        bio,
        lamportsPerMessage.toNumber()
      );

      const tx = await sendTransaction({
        connection,
        instruction: [instruction],
        signers: [],
        wallet,
      });

      console.log(tx);
    } catch (err) {
      console.log(err);
    } finally {
      // sleep for propagation
      await sleep(1_200);
      setLoading(false);
      navigation.goBack();
    }
  };

  return (
    <SafeAreaView style={GlobalStyle.container}>
      <ScrollView>
        {Array.from(new Set(displayNames))?.map((name, idx) => {
          return (
            <TouchableOpacity key={name + idx} onPress={handleOnPress(name)}>
              <Row
                label={name}
                value={
                  <>
                    {name === selectedDomain ? (
                      loading ? (
                        <ActivityIndicator />
                      ) : (
                        <Feather name="check" size={15} color="green" />
                      )
                    ) : undefined}
                  </>
                }
              />
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
};

export default SelectDisplayDomainNameScreen;
