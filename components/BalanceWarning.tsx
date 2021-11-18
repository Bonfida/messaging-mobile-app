import { Alert, Linking } from "react-native";
import { makeFtxPayUrl } from "../utils/ftx-pay";
import { isWeb } from "../utils/utils";

export const balanceWarning = (address: string) => {
  return isWeb
    ? alert("You don't have enough SOL in your wallet")
    : Alert.alert(
        "Low balances",
        "You don't have enough SOL in your wallet for this transaction.",
        [
          {
            text: "Buy SOL on FTX",
            onPress: () => Linking.openURL(makeFtxPayUrl(address)),
          },
          {
            text: "Cancel",
            style: "cancel",
          },
        ]
      );
};
