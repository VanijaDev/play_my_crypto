import {
  ethers
} from "ethers";
import MetaMaskManager from "../managers/metamaskManager";

let CoinFlipData = {
  address: "0x001c26Be0d22d38D37893a9e5495731be56c9042", //    Ganache
  abi: [{
      "inputs": [{
        "internalType": "address payable",
        "name": "_partner",
        "type": "address"
      }],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "anonymous": false,
      "inputs": [{
          "indexed": true,
          "internalType": "uint256",
          "name": "id",
          "type": "uint256"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "creator",
          "type": "address"
        }
      ],
      "name": "CF_GameAddedToTop",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [{
          "indexed": true,
          "internalType": "uint256",
          "name": "id",
          "type": "uint256"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "creator",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "bet",
          "type": "uint256"
        }
      ],
      "name": "CF_GameCreated",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [{
          "indexed": true,
          "internalType": "uint256",
          "name": "id",
          "type": "uint256"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "creator",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "opponent",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "address",
          "name": "winner",
          "type": "address"
        }
      ],
      "name": "CF_GameExpiredFinished",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [{
          "indexed": true,
          "internalType": "uint256",
          "name": "id",
          "type": "uint256"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "creator",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "opponent",
          "type": "address"
        }
      ],
      "name": "CF_GameJoined",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [{
        "indexed": true,
        "internalType": "uint256",
        "name": "id",
        "type": "uint256"
      }],
      "name": "CF_GamePaused",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [{
          "indexed": true,
          "internalType": "uint256",
          "name": "id",
          "type": "uint256"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "creator",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "opponent",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "address",
          "name": "winner",
          "type": "address"
        }
      ],
      "name": "CF_GamePlayed",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [{
        "indexed": true,
        "internalType": "address",
        "name": "player",
        "type": "address"
      }],
      "name": "CF_GamePrizesWithdrawn",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [{
          "indexed": true,
          "internalType": "uint256",
          "name": "id",
          "type": "uint256"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "creator",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "opponent",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "address",
          "name": "winner",
          "type": "address"
        }
      ],
      "name": "CF_GameQuittedFinished",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [{
        "indexed": true,
        "internalType": "address",
        "name": "referral",
        "type": "address"
      }],
      "name": "CF_GameReferralWithdrawn",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [{
          "indexed": true,
          "internalType": "uint256",
          "name": "id",
          "type": "uint256"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "creator",
          "type": "address"
        }
      ],
      "name": "CF_GameUnpaused",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [{
          "indexed": true,
          "internalType": "uint256",
          "name": "id",
          "type": "uint256"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "creator",
          "type": "address"
        }
      ],
      "name": "CF_GameUpdated",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [{
          "indexed": false,
          "internalType": "address",
          "name": "from",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "to",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "amount",
          "type": "uint256"
        }
      ],
      "name": "CF_PartnerFeeTransferred",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [{
          "indexed": true,
          "internalType": "address",
          "name": "winner",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "prize",
          "type": "uint256"
        }
      ],
      "name": "CF_RafflePlayed",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [{
        "indexed": true,
        "internalType": "address",
        "name": "winner",
        "type": "address"
      }],
      "name": "CF_RafflePrizeWithdrawn",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [{
          "indexed": true,
          "internalType": "address",
          "name": "previousOwner",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "newOwner",
          "type": "address"
        }
      ],
      "name": "OwnershipTransferred",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [{
        "indexed": false,
        "internalType": "address",
        "name": "account",
        "type": "address"
      }],
      "name": "Paused",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [{
        "indexed": false,
        "internalType": "address",
        "name": "account",
        "type": "address"
      }],
      "name": "Unpaused",
      "type": "event"
    },
    {
      "inputs": [],
      "name": "ACQUIRED_FEE_BENEFICIARY_MAX_DURATION",
      "outputs": [{
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [{
        "internalType": "uint256",
        "name": "_id",
        "type": "uint256"
      }],
      "name": "addTopGame",
      "outputs": [],
      "stateMutability": "payable",
      "type": "function"
    },
    {
      "inputs": [{
        "internalType": "address",
        "name": "",
        "type": "address"
      }],
      "name": "betTotal",
      "outputs": [{
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [{
          "internalType": "bytes32",
          "name": "_guessHash",
          "type": "bytes32"
        },
        {
          "internalType": "address",
          "name": "_referral",
          "type": "address"
        }
      ],
      "name": "createGame",
      "outputs": [],
      "stateMutability": "payable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "devFeePending",
      "outputs": [{
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "feeBeneficiar",
      "outputs": [{
        "internalType": "address payable",
        "name": "",
        "type": "address"
      }],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [{
        "internalType": "address",
        "name": "",
        "type": "address"
      }],
      "name": "feeBeneficiarBalances",
      "outputs": [{
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "feeBeneficiarPurchasedAt",
      "outputs": [{
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [{
        "internalType": "address",
        "name": "",
        "type": "address"
      }],
      "name": "feeBeneficiaryWithdrawn",
      "outputs": [{
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [{
        "internalType": "uint256",
        "name": "_id",
        "type": "uint256"
      }],
      "name": "finishExpiredGame",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "gameMoveDuration",
      "outputs": [{
        "internalType": "uint16",
        "name": "",
        "type": "uint16"
      }],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [{
        "internalType": "uint256",
        "name": "_id",
        "type": "uint256"
      }],
      "name": "gameMoveExpired",
      "outputs": [{
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [{
        "internalType": "uint256",
        "name": "_id",
        "type": "uint256"
      }],
      "name": "gameOnPause",
      "outputs": [{
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [{
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }],
      "name": "games",
      "outputs": [{
          "internalType": "bool",
          "name": "paused",
          "type": "bool"
        },
        {
          "internalType": "uint8",
          "name": "creatorCoinSide",
          "type": "uint8"
        },
        {
          "internalType": "uint8",
          "name": "opponentCoinSide",
          "type": "uint8"
        },
        {
          "internalType": "uint256",
          "name": "id",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "bet",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "opponentJoinedAt",
          "type": "uint256"
        },
        {
          "internalType": "bytes32",
          "name": "creatorGuessHash",
          "type": "bytes32"
        },
        {
          "internalType": "address payable",
          "name": "creator",
          "type": "address"
        },
        {
          "internalType": "address payable",
          "name": "opponent",
          "type": "address"
        },
        {
          "internalType": "address payable",
          "name": "winner",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "creatorReferral",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "opponentReferral",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "gamesCompletedAmount",
      "outputs": [{
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "gamesCreatedAmount",
      "outputs": [{
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [{
          "internalType": "address",
          "name": "",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "gamesWithPendingPrizeWithdrawal",
      "outputs": [{
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [{
        "internalType": "address",
        "name": "_address",
        "type": "address"
      }],
      "name": "getGamesWithPendingPrizeWithdrawal",
      "outputs": [{
        "internalType": "uint256[]",
        "name": "ids",
        "type": "uint256[]"
      }],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [{
        "internalType": "address",
        "name": "_address",
        "type": "address"
      }],
      "name": "getPlayedGamesForPlayer",
      "outputs": [{
        "internalType": "uint256[]",
        "name": "",
        "type": "uint256[]"
      }],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getRaffleParticipants",
      "outputs": [{
        "internalType": "address[]",
        "name": "",
        "type": "address[]"
      }],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getRaffleResultCount",
      "outputs": [{
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getTopGames",
      "outputs": [{
        "internalType": "uint256[5]",
        "name": "",
        "type": "uint256[5]"
      }],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [{
        "internalType": "uint256",
        "name": "_id",
        "type": "uint256"
      }],
      "name": "increaseBetForGameBy",
      "outputs": [],
      "stateMutability": "payable",
      "type": "function"
    },
    {
      "inputs": [{
        "internalType": "uint256",
        "name": "_id",
        "type": "uint256"
      }],
      "name": "isTopGame",
      "outputs": [{
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [{
          "internalType": "uint256",
          "name": "_id",
          "type": "uint256"
        },
        {
          "internalType": "uint8",
          "name": "_coinSide",
          "type": "uint8"
        },
        {
          "internalType": "address",
          "name": "_referral",
          "type": "address"
        }
      ],
      "name": "joinGame",
      "outputs": [],
      "stateMutability": "payable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "kill",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "latestBeneficiarPrice",
      "outputs": [{
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "makeFeeBeneficiar",
      "outputs": [],
      "stateMutability": "payable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "minBet",
      "outputs": [{
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "ongoinRafflePrize",
      "outputs": [{
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [{
        "internalType": "address",
        "name": "",
        "type": "address"
      }],
      "name": "ongoingGameAsCreator",
      "outputs": [{
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [{
        "internalType": "address",
        "name": "",
        "type": "address"
      }],
      "name": "ongoingGameAsOpponent",
      "outputs": [{
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "owner",
      "outputs": [{
        "internalType": "address",
        "name": "",
        "type": "address"
      }],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "partner",
      "outputs": [{
        "internalType": "address payable",
        "name": "",
        "type": "address"
      }],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "partnerFeePending",
      "outputs": [{
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "partnerFeeTotalUsed",
      "outputs": [{
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "partnerFeeTransferThreshold",
      "outputs": [{
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "pause",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [{
        "internalType": "uint256",
        "name": "_id",
        "type": "uint256"
      }],
      "name": "pauseGame",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "paused",
      "outputs": [{
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [{
          "internalType": "uint256",
          "name": "_id",
          "type": "uint256"
        },
        {
          "internalType": "uint8",
          "name": "_coinSide",
          "type": "uint8"
        },
        {
          "internalType": "bytes32",
          "name": "_seedHash",
          "type": "bytes32"
        }
      ],
      "name": "playGame",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [{
        "internalType": "address",
        "name": "",
        "type": "address"
      }],
      "name": "prizeTotal",
      "outputs": [{
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [{
        "internalType": "uint256",
        "name": "_id",
        "type": "uint256"
      }],
      "name": "quitGame",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "raffleActivated",
      "outputs": [{
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "raffleActivationParticipantsAmount",
      "outputs": [{
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [{
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }],
      "name": "raffleParticipants",
      "outputs": [{
        "internalType": "address",
        "name": "",
        "type": "address"
      }],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [{
        "internalType": "address",
        "name": "",
        "type": "address"
      }],
      "name": "rafflePrizePending",
      "outputs": [{
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [{
        "internalType": "address",
        "name": "",
        "type": "address"
      }],
      "name": "rafflePrizeWithdrawn",
      "outputs": [{
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "rafflePrizesWonTotal",
      "outputs": [{
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [{
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }],
      "name": "raffleResults",
      "outputs": [{
          "internalType": "address",
          "name": "winner",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "prize",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "time",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "rand",
      "outputs": [{
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [{
        "internalType": "address",
        "name": "",
        "type": "address"
      }],
      "name": "referralFeesPending",
      "outputs": [{
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [{
        "internalType": "address",
        "name": "",
        "type": "address"
      }],
      "name": "referralFeesWithdrawn",
      "outputs": [{
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "renounceOwnership",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "runRaffle",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [{
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }],
      "name": "topGames",
      "outputs": [{
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "totalUsedInGame",
      "outputs": [{
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "totalUsedReferralFees",
      "outputs": [{
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [{
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }],
      "name": "transferOwnership",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "unpause",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [{
        "internalType": "uint256",
        "name": "_id",
        "type": "uint256"
      }],
      "name": "unpauseGame",
      "outputs": [],
      "stateMutability": "payable",
      "type": "function"
    },
    {
      "inputs": [{
        "internalType": "uint16",
        "name": "_duration",
        "type": "uint16"
      }],
      "name": "updateGameMoveDuration",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [{
        "internalType": "uint256",
        "name": "_minBet",
        "type": "uint256"
      }],
      "name": "updateMinBet",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [{
        "internalType": "address payable",
        "name": "_partnerAddress",
        "type": "address"
      }],
      "name": "updatePartner",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [{
        "internalType": "uint256",
        "name": "_transferThreshold",
        "type": "uint256"
      }],
      "name": "updatePartnerTransferThreshold",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [{
        "internalType": "uint256",
        "name": "_amount",
        "type": "uint256"
      }],
      "name": "updateRaffleActivationParticipantsCount",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "withdrawBeneficiaryFee",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "withdrawDevFee",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [{
        "internalType": "uint256",
        "name": "_maxLoop",
        "type": "uint256"
      }],
      "name": "withdrawGamePrizes",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "withdrawRafflePrizes",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "withdrawReferralFees",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ],

  build: function () {
    try {
      return new ethers.Contract(this.address, this.abi, window.MetaMaskManager.provider);
    } catch (error) {
      console.error(error);
    }
  }
}


export {
  CoinFlipData
};