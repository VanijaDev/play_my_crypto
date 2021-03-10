import {
  ethers
} from "ethers";

const BlockchainManager = {
  //  API
  referralFeesUsedTotal: async function (_gameType) {
    return new BigNumber(await PromiseManager.referralFeesUsedTotalPromise(_gameType));
  },
};


// window.BlockchainManager = BlockchainManager;

export default BlockchainManager;