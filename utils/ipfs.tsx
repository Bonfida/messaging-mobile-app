import { create } from "ipfs-http-client";

export const cache = new Map<string, any>();

export const client = create({ url: "https://ipfs.infura.io:5001/api/v0" });
