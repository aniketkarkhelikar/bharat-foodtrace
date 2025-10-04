require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const { POLYGON_MUMBAI_RPC_URL, SERVER_PRIVATE_KEY } = process.env;

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.24",
  networks: {
    mumbai: {
      url: POLYGON_MUMBAI_RPC_URL,
      accounts: [`0x${SERVER_PRIVATE_KEY}`],
    },
  },
};
