import React from "react";
import { ScrollView, SafeAreaView } from "react-native";
import { CachePrefix, useGetAsyncCache } from "../utils/cache";
import MessageRow from "../components/ContactRow";
import { PublicKey } from "@solana/web3.js";

const ArchivedScreen = () => {
  const [archived]: string[][] = useGetAsyncCache(
    CachePrefix.Archive,
    false,
    1_000
  );

  return (
    <SafeAreaView>
      <ScrollView>
        {archived?.map((archive, idx) => {
          return (
            <MessageRow
              key={archive + idx}
              contact={new PublicKey(archive)}
              currentCount={0}
              showArchived
            />
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
};

export default ArchivedScreen;
