let Web3 = require('web3');
let Contract = require('web3-eth-contract');
let Table = require('cli-table');
const {SELLER_PUBLIC, BUYER_PUBLIC, PROVIDER} = require('./config');
let web3 = new Web3(new Web3.providers.HttpProvider(PROVIDER));
// set provider for all later instances to use
Contract.setProvider(PROVIDER);

async function checkBalances() {
  let sellerBalance = await web3.eth.getBalance(SELLER_PUBLIC);
  let buyerBalance = await web3.eth.getBalance(BUYER_PUBLIC);
  let denominator = 10 ** 18;
  let sbal = sellerBalance / denominator;
  let bbal = buyerBalance / denominator;
  console.assert(sbal >= 0);
  console.assert(bbal >= 0);
  let table = new Table({
    head: ['ACCOUNT TYPE', 'ADDRESS', 'ETH VALUE'],
  });
  table.push(['SELLER', SELLER_PUBLIC, sbal]);
  table.push(['BUYER', BUYER_PUBLIC, bbal]);
  return table.toString();
}

module.exports = checkBalances;