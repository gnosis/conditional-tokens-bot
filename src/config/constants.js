const { networkName } = require('./index');

const urlExplorer = (networkName == "rinkeby") ? 'rinkeby.etherscan.io' : 'etherscan.io';

module.exports = {
    networkName,
    urlExplorer,
}