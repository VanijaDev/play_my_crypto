/*
 * ATTENTION: The "eval" devtool has been used (maybe by default in mode: "development").
 * This devtool is not neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./web/src/index.js":
/*!**************************!*\
  !*** ./web/src/index.js ***!
  \**************************/
/*! namespace exports */
/*! export default [provided] [no usage info] [missing usage info prevents renaming] */
/*! other exports [not provided] [no usage info] */
/*! runtime requirements: __webpack_require__, __webpack_exports__, __webpack_require__.r, __webpack_require__.d, __webpack_require__.* */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"default\": () => __WEBPACK_DEFAULT_EXPORT__\n/* harmony export */ });\n/* harmony import */ var _metamaskManager_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./metamaskManager.js */ \"./web/src/metamaskManager.js\");\n;\n\nconst Index = {\n\n  setup: function () {\n    if (ethereum.chainId == _metamaskManager_js__WEBPACK_IMPORTED_MODULE_0__.default.ChainIDs.ETH) {\n      console.log(\"setup ETH\");\n    } else if (ethereum.chainId == _metamaskManager_js__WEBPACK_IMPORTED_MODULE_0__.default.ChainIDs.BSC) {\n      console.log(\"setup BSC\");\n    } else {\n      console.error(\"setup - disable page\");\n      _metamaskManager_js__WEBPACK_IMPORTED_MODULE_0__.default.deinit();\n      alert(\"Wrong Network\");\n      return;\n    }\n  },\n\n\n  buttonClick: async function () {\n    if (await _metamaskManager_js__WEBPACK_IMPORTED_MODULE_0__.default.isMetaMaskLogged()) {\n      console.log(\"buttonClick\");\n    } else {\n      alert(\"buttonClick - MetaMask not logged in\");\n    }\n  }\n\n};\n\nwindow.addEventListener('load', async (event) => {\n  console.log('page is fully loaded');\n\n  if (!_metamaskManager_js__WEBPACK_IMPORTED_MODULE_0__.default.isEthereum()) {\n    alert(\"Please login to MetaMask - isEthereum\");\n    return;\n  }\n\n  if (!(await _metamaskManager_js__WEBPACK_IMPORTED_MODULE_0__.default.getAccount()).length) {\n    alert(\"Please login to MetaMask - getAccount\");\n    return;\n  }\n\n  if (_metamaskManager_js__WEBPACK_IMPORTED_MODULE_0__.default.isNetworkValid(ethereum.chainId)) {\n    _metamaskManager_js__WEBPACK_IMPORTED_MODULE_0__.default.init();\n    window.Index.setup();\n  } else {\n    alert(\"Wrong Network\");\n    return;\n  }\n});\n\nethereum.on('message', function (message) {\n  console.log('message: ', message);\n});\n\nethereum.on('accountsChanged', function (accounts) {\n  console.log('accountsChanged: ', accounts);\n\n  if (accounts.length == 0) {\n    console.log(\"accountsChanged - disable page\");\n    _metamaskManager_js__WEBPACK_IMPORTED_MODULE_0__.default.deinit();\n    return;\n  }\n\n  if (_metamaskManager_js__WEBPACK_IMPORTED_MODULE_0__.default.isNetworkValid(ethereum.chainId)) {\n    window.Index.setup();\n  } else {\n    _metamaskManager_js__WEBPACK_IMPORTED_MODULE_0__.default.deinit();\n    alert(\"Wrong Network\");\n    return;\n  }\n});\n\nethereum.on('chainChanged', function (chainId) {\n  console.log('chainChanged: ', chainId);\n\n  if (_metamaskManager_js__WEBPACK_IMPORTED_MODULE_0__.default.isNetworkValid(chainId)) {\n    window.Index.setup();\n  } else {\n    _metamaskManager_js__WEBPACK_IMPORTED_MODULE_0__.default.deinit();\n    alert(\"Wrong Network\");\n    return;\n  }\n});\n\nethereum.on('disconnect', function (chainId) {\n  console.log('disconnect: ', chainId);\n});\n\n\nwindow.Index = Index;\n\n/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (Index);\n\n//# sourceURL=webpack://play_my_crypto/./web/src/index.js?");

/***/ }),

/***/ "./web/src/metamaskManager.js":
/*!************************************!*\
  !*** ./web/src/metamaskManager.js ***!
  \************************************/
/*! namespace exports */
/*! export default [provided] [no usage info] [missing usage info prevents renaming] */
/*! other exports [not provided] [no usage info] */
/*! runtime requirements: __webpack_exports__, __webpack_require__.r, __webpack_require__.d, __webpack_require__.* */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"default\": () => __WEBPACK_DEFAULT_EXPORT__\n/* harmony export */ });\nconst MetaMaskManager = {\n\n  MetaMaskErrorCodes: {\n    userDenied: 4001,\n    invalidParams: -32602,\n    internalError: 32603\n  },\n\n  ChainIDs: {\n    ETH: 0x1,\n    BSC: 0x38\n  },\n\n  isReady: false,\n\n  isEthereum: function () {\n    try {\n      return (ethereum != null && typeof ethereum !== 'undefined');\n    } catch (error) {\n      return false;\n    }\n  },\n\n  isNetworkValid: async function (chainId) {\n    return (chainId === this.ChainIDs.ETH || chainId == this.ChainIDs.BSC);\n  },\n\n  //  MetaMask does not handle log out properly. So, need to check if logged in before each request.\n  isMetaMaskLogged: async function () {\n    try {\n      await this.getAccount();\n      return true;\n    } catch (error) {\n      alert(\"MetaMask - not Logged in\");\n    }\n  },\n\n  init: function () {\n    console.log(\"MetaMaskManager - init\");\n\n    ethereum.autoRefreshOnNetworkChange = false;\n    this.isReady = true;\n  },\n\n  deinit: function () {\n    console.log(\"MetaMaskManager - deinit\");\n\n    this.isReady = false;\n  },\n\n  getAccount: async function () {\n    const accounts = await ethereum.request({\n      method: 'eth_requestAccounts'\n    });\n    return accounts[0];\n  },\n};\n\n\n// window.MetaMaskManager = MetaMaskManager;\n\n/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (MetaMaskManager);\n\n//# sourceURL=webpack://play_my_crypto/./web/src/metamaskManager.js?");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		if(__webpack_module_cache__[moduleId]) {
/******/ 			return __webpack_module_cache__[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => Object.prototype.hasOwnProperty.call(obj, prop)
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	// startup
/******/ 	// Load entry module
/******/ 	__webpack_require__("./web/src/index.js");
/******/ 	// This entry module used 'exports' so it can't be inlined
/******/ })()
;