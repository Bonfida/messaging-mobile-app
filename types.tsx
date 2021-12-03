import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "./App";
import { EmitterSubscription } from "react-native";

export type messagesScreenProp = StackNavigationProp<
  RootStackParamList,
  "Messages"
>;

export type messageScreenProp = StackNavigationProp<
  RootStackParamList,
  "Messages"
>;

export type editFeeScreenProp = StackNavigationProp<
  RootStackParamList,
  "Edit Fee"
>;

export type settingsScreenProp = StackNavigationProp<
  RootStackParamList,
  "Settings"
>;

export type profileScreenProp = StackNavigationProp<
  RootStackParamList,
  "Profile"
>;

export type archivedScreenProp = StackNavigationProp<
  RootStackParamList,
  "Archived"
>;

export type seedScreenProp = StackNavigationProp<RootStackParamList, "Seed">;

export type mediaScreenProp = StackNavigationProp<RootStackParamList, "Media">;

export type exportSeedsScreenProp = StackNavigationProp<
  RootStackParamList,
  "Export Seeds"
>;

export type groupMessagesScreenProp = StackNavigationProp<
  RootStackParamList,
  "Group Messages"
>;

export type groupInfoScreenProp = StackNavigationProp<
  RootStackParamList,
  "Group Info"
>;

export type editAdminScreenProp = StackNavigationProp<
  RootStackParamList,
  "Edit Admins"
>;

export type appInformationScreenProp = StackNavigationProp<
  RootStackParamList,
  "App Information"
>;

export type groupMembersScreenProp = StackNavigationProp<
  RootStackParamList,
  "Group Members"
>;

export type selectDisplayNameScreenProp = StackNavigationProp<
  RootStackParamList,
  "Select Display Domain"
>;

export type changeRpcEndpointScreenProp = StackNavigationProp<
  RootStackParamList,
  "Change RPC endpoint"
>;

export interface IPost {
  Hash: string;
}

export enum IStep {
  Welcome,
  Restore,
  ConfirmRestore,
  CreateWallet,
  BuyDomain,
  CheckAddress,
}

export type keyBoardRef = React.MutableRefObject<EmitterSubscription | null>;
