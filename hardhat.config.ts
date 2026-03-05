import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";
dotenv.config();

const config: HardhatUserConfig = {
    solidity: "0.8.24",
    networks: {
        tenderly: {
            url: process.env.TENDERLY_RPC_URL || "",
            accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
            chainId: Number(process.env.TENDERLY_CHAIN_ID || "1"),
        },
    },
};

export default config;
