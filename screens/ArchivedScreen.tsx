import React, { useState } from "react";
import { ScrollView, SafeAreaView } from "react-native";
import { CachePrefix, useGetAsyncCache } from "../utils/cache";
import MessageRow from "../components/ContactRow";
import { PublicKey } from "@solana/web3.js";

const ArchivedScreen = () => {
  const [refresh, setRefresh] = useState(false);
  const archived = useGetAsyncCache<string[]>(CachePrefix.Archive, refresh);

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
              setRefresh={setRefresh}
            />
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
};

export default ArchivedScreen;
