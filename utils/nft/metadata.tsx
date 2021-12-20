import { Connection, PublicKey } from "@solana/web3.js";
import { findProgramAddress } from "../web3/program-address";
import { deserializeUnchecked } from "borsh";
import { useConnection } from "../connection";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { useEffect, useRef, useState } from "react";

const PREFIX = "metadata";
const TOKEN_METADATA_ID = new PublicKey(
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
);

const METADATA_REPLACE = new RegExp("\u0000", "g");

export enum MetadataKey {
  Uninitialized = 0,
  MetadataV1 = 4,
  EditionV1 = 1,
  MasterEditionV1 = 2,
  MasterEditionV2 = 6,
  EditionMarker = 7,
}

export const decodeMetadata = (buffer: Buffer): Metadata => {
  const metadata = deserializeUnchecked(
    METADATA_SCHEMA,
    Metadata,
    buffer
  ) as Metadata;
  metadata.data.name = metadata.data.name.replace(METADATA_REPLACE, "");
  metadata.data.uri = metadata.data.uri.replace(METADATA_REPLACE, "");
  metadata.data.symbol = metadata.data.symbol.replace(METADATA_REPLACE, "");
  return metadata;
};

export class Creator {
  address: PublicKey;
  verified: boolean;
  share: number;

  constructor(args: { address: PublicKey; verified: boolean; share: number }) {
    this.address = args.address;
    this.verified = args.verified;
    this.share = args.share;
  }
}

export class Data {
  name: string;
  symbol: string;
  uri: string;
  sellerFeeBasisPoints: number;
  creators: Creator[] | null;
  constructor(args: {
    name: string;
    symbol: string;
    uri: string;
    sellerFeeBasisPoints: number;
    creators: Creator[] | null;
  }) {
    this.name = args.name;
    this.symbol = args.symbol;
    this.uri = args.uri;
    this.sellerFeeBasisPoints = args.sellerFeeBasisPoints;
    this.creators = args.creators;
  }
}

export class Metadata {
  key: MetadataKey;
  updateAuthority: PublicKey;
  mint: PublicKey;
  data: Data;
  primarySaleHappened: boolean;
  isMutable: boolean;
  editionNonce: number | null;

  // set lazy
  masterEdition?: PublicKey;
  edition?: PublicKey;

  constructor(args: {
    updateAuthority: PublicKey;
    mint: PublicKey;
    data: Data;
    primarySaleHappened: boolean;
    isMutable: boolean;
    editionNonce: number | null;
  }) {
    this.key = MetadataKey.MetadataV1;
    this.updateAuthority = args.updateAuthority;
    this.mint = args.mint;
    this.data = args.data;
    this.primarySaleHappened = args.primarySaleHappened;
    this.isMutable = args.isMutable;
    this.editionNonce = args.editionNonce ?? null;
  }
}

export const METADATA_SCHEMA = new Map<any, any>([
  [
    Data,
    {
      kind: "struct",
      fields: [
        ["name", "string"],
        ["symbol", "string"],
        ["uri", "string"],
        ["sellerFeeBasisPoints", "u16"],
        ["creators", { kind: "option", type: [Creator] }],
      ],
    },
  ],
  [
    Creator,
    {
      kind: "struct",
      fields: [
        ["address", [32]],
        ["verified", "u8"],
        ["share", "u8"],
      ],
    },
  ],
  [
    Metadata,
    {
      kind: "struct",
      fields: [
        ["key", "u8"],
        ["updateAuthority", [32]],
        ["mint", [32]],
        ["data", Data],
        ["primarySaleHappened", "u8"], // bool
        ["isMutable", "u8"], // bool
        ["editionNonce", { kind: "option", type: "u8" }],
      ],
    },
  ],
]);

export const getMultipleAccountsInfo = async (
  connection: Connection,
  keys: PublicKey[]
) => {
  let results = await connection.getMultipleAccountsInfo(keys.splice(0, 100));
  while (keys.length > 0) {
    results.push(
      ...(await connection.getMultipleAccountsInfo(keys.splice(0, 100)))
    );
  }
  return results;
};

export const findMetaDataKey = async (mint: PublicKey) => {
  const seeds = [
    Buffer.from(PREFIX),
    TOKEN_METADATA_ID.toBuffer(),
    mint.toBuffer(),
  ];
  const [key] = await findProgramAddress(seeds, TOKEN_METADATA_ID);
  return key;
};

export const useNft = (owner: PublicKey | undefined | null) => {
  const connection = useConnection();
  const mountedRef = useRef(true);
  const [nfts, setNfts] = useState<
    { key: PublicKey; metadata: Metadata }[] | null
  >(null);

  const fn = async () => {
    if (!owner) return;

    const accounts = await connection.getParsedTokenAccountsByOwner(owner, {
      programId: TOKEN_PROGRAM_ID,
    });

    const possibleNfts = accounts.value.filter(
      (e) =>
        e.account.data.parsed.info.tokenAmount.decimals === 0 &&
        e.account.data.parsed.info.tokenAmount.uiAmount > 0
    );

    const metadataKeys = await Promise.all(
      possibleNfts.map((e) =>
        findMetaDataKey(new PublicKey(e.account.data.parsed.info.mint))
      )
    );

    const metadata = (await getMultipleAccountsInfo(connection, metadataKeys))
      .map((e, idx) => {
        if (!e?.data) return;
        return { key: metadataKeys[idx], metadata: decodeMetadata(e?.data) };
      })
      .filter((e) => !!e) as { key: PublicKey; metadata: Metadata }[];

    setNfts(metadata);
  };

  useEffect(() => {
    fn();

    return () => {
      mountedRef.current = false;
    };
  }, [owner?.toBase58()]);

  return nfts;
};
