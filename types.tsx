import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "./App";

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
export interface IPost {
  Hash: string;
}

export enum Step {
  Welcome,
  Restore,
  ConfirmRestore,
  CreateWallet,
  BuyDomain,
}
