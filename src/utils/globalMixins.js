import Vue from "vue";
import {
  ethers,
  BigNumber
} from "ethers";

export default {
  data() {
    return {
      $loader: null,
      isLoading: false,

    };
  },
  computed: {
    gUser() {
      return this.$store.getters['user/user']
    },
    gUserTotalOutChange() {
      if (this.gGameData && this.gGameData.playerStakeTotal && this.gGameData.playerWithdrawedTotal) {
        if (this.gGameData.playerStakeTotal.eq(this.gGameData.playerWithdrawedTotal)) return null
        return this.gGameData.playerStakeTotal.gt(this.gGameData.playerWithdrawedTotal) ? 'down' : 'up'
      }
      return null
    },
    gNetwork() {
      return this.$store.getters['blockchain/network']
    },
    gBlockchain() {
      return this.$store.getters['blockchain/blockchain']
    },
    gCurrentNetworkIcon() {
      return this.gNetwork.id ? this.gNetwork.icon : this.gBlockchain.networks[0].icon
    },

    gGame() {
      return this.$store.getters['games/currentGame']
    },
    gGameData() {
      return this.gGame.id ? this.gGame.data : {}
    },
    getGameById() {
      return function (gameId) {
        return this.$store.getters['games/getGameById'](gameId)
      }
    },
    //blockchain() { return this.$store.getters['blockchain/blockchain'] },

    gBreakPoint() {
      return function (bp, condition) {
        return this.$store.getters.breakPoint(bp, condition)
      }
    },
  },
  methods: {
    gSelectGame(game) {
      if (game.id && this.$route.name !== game.routeName) this.$router.push(game.routeName)
    },
    cleanObject: obj => cleanObject(obj),
    copyToClipboard(text) {
      if (!text) return;
      if (copyTextToClipboard(text)) {
        this.$toastSuccess('Скопійовано в буфер обміну', 1000)
      } else {
        this.$toastError('Помилка копіювання в буфер обміну. Зробіть це власноруч', 2000)
      }
    },

    // Loader
    $loaderShow({
      ...options
    }) {
      if (this.$loader) {
        this.$loader.hide()
        this.$loader = null;
      }
      this.isLoading = true;
      options.container = options.container ? options.container : document.querySelector("[loading-container]")
      this.$loader = this.$loading.show(options)
    },
    $loaderHide(delay = 500) {
      return new Promise(resolve => setTimeout(() => {
        if (this.$loader) {
          this.$loader.hide()
        }
        this.$loader = null;
        this.isLoading = false;
        resolve()
      }, delay));
    },

    // Toast
    $toastSuccess(message = 'Виконано!', delay = 2000) {
      this.$bvToast.toast('success', {
        title: message,
        toaster: 'b-toaster-top-center',
        solid: true,
        variant: 'success',
        appendToast: true,
        autoHideDelay: delay,
        toastClass: 'k__toast-wrapper',
        headerClass: 'k__toast-header',
        bodyClass: 'k__toast-body',
      })
    },
    $toastError(message = 'Відбулась помилка!', delay = 3000) {
      this.$bvToast.toast('error', {
        title: message,
        toaster: 'b-toaster-top-center',
        solid: true,
        variant: 'danger',
        appendToast: true,
        autoHideDelay: delay,
        toastClass: 'k__toast-wrapper',
        headerClass: 'k__toast-header',
        bodyClass: 'k__toast-body',
      })
    },
    gOpenTelegram() {
      window.open("https://t.me/playmycrypto");
    }
  },
  filters: {
    addressShort(tokenAddress) {
      if (tokenAddress) return tokenAddress.replace(tokenAddress.substring(6, 36), "...")
      return '...'
    },
    formatBalance(val) {
      if (!BigNumber.isBigNumber(val)) return '.......'
      if (BigNumber.isBigNumber(val)) return parseFloat(ethers.utils.formatEther(val));
      return '0.00000'
    },
    formatBalanceShort(val) {
      if (!BigNumber.isBigNumber(val)) return '.......'
      if (BigNumber.isBigNumber(val)) return parseFloat(ethers.utils.formatEther(val)).toFixed(5);
      return '0.00000'
    },
  },
}

function copyTextToClipboard(text) {
  if (!navigator.clipboard) {
    var textArea = document.createElement("textarea");
    textArea.value = text;
    // Avoid scrolling to bottom
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      var successful = document.execCommand('copy');
      var msg = successful ? 'successful' : 'unsuccessful';
      Vue.$log.info('Fallback: Copying text command was ' + msg);
    } catch (err) {
      Vue.$log.error('Fallback: Oops, unable to copy', err);
      return false;
    }
    document.body.removeChild(textArea);
    return true;
  }
  navigator.clipboard.writeText(text).then(function () {
    Vue.$log.info('Async: Copying to clipboard was successful!');
  }, function (err) {
    Vue.$log.error('Async: Could not copy text: ', err);
    return false;
  });
  return true;
}

function cleanObject(obj) {
  return JSON.parse(JSON.stringify(obj))
}

export {
  cleanObject
}