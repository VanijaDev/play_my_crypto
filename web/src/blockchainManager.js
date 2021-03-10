import {
  ethers
} from "ethers";

const BlockchainManager = {
  //  API read
  referralFeesUsedTotalPromise: async function (_gameType) {
    return new Promise(resolve => {
      window.BlockchainManager.gameInst(_gameType).methods.ongoingGameAsOpponent(_account).call()
        .then(result => {
          resolve(result);
        })
        .catch(err => {
          throw new Error(err);
        });
    });
  },
};

export default BlockchainManager;