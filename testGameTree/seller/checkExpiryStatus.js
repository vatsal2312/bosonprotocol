let Contract = require('web3-eth-contract');
const Utils = require('../helpers/utils');
const VoucherKernel = require('../../build/contracts/VoucherKernel.json')
  .abi;
const {contracts, PROVIDER} = require('../helpers/config');
// set provider for all later instances to use
Contract.setProvider(PROVIDER);

function checkVoucherStatus(_voucherID) {
  return new Promise((resolve) => {
    const voucherKernel = new Contract(VoucherKernel, Utils.contractVoucherKernel.address);

    voucherKernel.methods
      .getVoucherStatus(_voucherID)
      .call()
      .then(function (result) {
        let output = {
          voucherID: _voucherID,
          Status: result[0],
        };
        return resolve(output);
      });
  });
}

module.exports = checkVoucherStatus;