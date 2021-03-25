const networks = {
  ETH: {
    name: 'ETHEREUM',
    icon: '/img/ethereum_icon.svg', 
    chains: {
      mainnet: { id: '0x1', name: 'Mainnet' },
      ropsten: { id: '0x3', name: 'Ropsten' },
      kovan: { id: '0x42', name: 'Kovan' },  
    }    
  },
  BSC: {
    name: 'BINANCE',
    icon: '/img/binance_icon.svg', 
    chains: {
      mainnet: { id: '0x56', name: 'Mainnet' },
      chapel: { id: '0x97', name: 'Chapel' },
    }
  }
}

export default {
  networks
}