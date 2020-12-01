const chai = require('chai')
let chaiAsPromised = require("chai-as-promised")
chai.use(chaiAsPromised)
const assert = chai.assert

const BN = web3.utils.BN
const UtilsBuilder = require('../testHelpers/utilsBuilder')
const Utils = require('../testHelpers/utils')
let utils

const ERC1155ERC721 = artifacts.require("ERC1155ERC721")
const VoucherKernel = artifacts.require("VoucherKernel")
const Cashier = artifacts.require("Cashier")
const BosonTKN = artifacts.require("BosonToken")

const helpers = require("../testHelpers/constants")
const timemachine = require('../testHelpers/timemachine')
const truffleAssert = require('truffle-assertions')
const config = require('../testHelpers/config.json')

let TOKEN_SUPPLY_ID

contract("Cashier withdrawals ", async accounts => {

    let Deployer = config.accounts.deployer
    let Seller = config.accounts.seller
    let Buyer = config.accounts.buyer
    let RandomUser = config.accounts.randomUser // will be used to clear tokens received after every successful test

    let contractERC1155ERC721, contractVoucherKernel, contractCashier, contractBSNTokenPrice, contractBSNTokenDeposit

    let distributedAmounts = {
        buyerAmount: new BN(0),
        sellerAmount: new BN(0),
        escrowAmount: new BN(0)
    }

    async function deployContracts() {
        contractERC1155ERC721 = await ERC1155ERC721.new()
        contractVoucherKernel = await VoucherKernel.new(contractERC1155ERC721.address)
        contractCashier = await Cashier.new(contractVoucherKernel.address)
        contractBSNTokenPrice = await BosonTKN.new('BosonTokenPrice', 'BPRC');
        contractBSNTokenDeposit = await BosonTKN.new('BosonTokenDeposit', 'BDEP');

        await contractERC1155ERC721.setApprovalForAll(contractVoucherKernel.address, 'true')
        await contractERC1155ERC721.setVoucherKernelAddress(contractVoucherKernel.address)
        await contractVoucherKernel.setCashierAddress(contractCashier.address)

        await contractVoucherKernel.setComplainPeriod(60); //60 seconds
        await contractVoucherKernel.setCancelFaultPeriod(60); //60 seconds
    } 

    // this functions is used after each interaction with tokens to clear balances
    async function giveAwayToRandom() {
        const balanceBuyerFromPayment = await contractBSNTokenPrice.balanceOf(Buyer.address)
        const balanceBuyerFromDesosits = await contractBSNTokenDeposit.balanceOf(Buyer.address)

        const balanceSellerFromPayment = await contractBSNTokenPrice.balanceOf(Seller.address)
        const balanceSellerFromDesosits = await contractBSNTokenDeposit.balanceOf(Seller.address)

        const escrowBalanceFromPayment = await contractBSNTokenPrice.balanceOf(Deployer.address)
        const escrowBalanceFromDeposits = await contractBSNTokenDeposit.balanceOf(Deployer.address)

        await contractBSNTokenPrice.transfer(RandomUser.address, balanceBuyerFromPayment, { from: Buyer.address })
        await contractBSNTokenDeposit.transfer(RandomUser.address, balanceBuyerFromDesosits, { from: Buyer.address })
        await contractBSNTokenPrice.transfer(RandomUser.address, balanceSellerFromPayment, { from: Seller.address })
        await contractBSNTokenDeposit.transfer(RandomUser.address, balanceSellerFromDesosits, { from: Seller.address })
        await contractBSNTokenPrice.transfer(RandomUser.address, escrowBalanceFromPayment, { from: Deployer.address })
        await contractBSNTokenDeposit.transfer(RandomUser.address, escrowBalanceFromDeposits, { from: Deployer.address })

    }

    describe('Withdraw scenarios', async () => {
        
        before(async () => {
            await deployContracts();
        })

        describe('ETH - ETH', async () => {
            
            before(async () => {

                utils = UtilsBuilder
                    .NEW()
                    .ETH_ETH()
                    .build(contractERC1155ERC721, contractVoucherKernel, contractCashier)

                const timestamp = await Utils.getCurrTimestamp()

                TOKEN_SUPPLY_ID = await utils.createOrder(Seller.address, timestamp, timestamp + helpers.SECONDS_IN_DAY)
            })

            it("COMMIT->REFUND->COMPLAIN->CANCEL->FINALIZE->WITHDRAW", async () => {

                const expectedBuyerAmount = new BN(helpers.buyer_deposit).add(new BN(helpers.product_price)).add(new BN(helpers.seller_deposit).div(new BN(2))) // 0.3 + 0.04 + 0.025
                const expectedSellerAmount = new BN(helpers.seller_deposit).div(new BN(4)) // 0.0125
                const expectedEscrowAmount = new BN(helpers.seller_deposit).div(new BN(4)) // 0.0125

                const voucherID = await utils.commitToBuy(Buyer.address, Seller.address, TOKEN_SUPPLY_ID)

                await utils.refund(voucherID, Buyer.address)
                await utils.complain(voucherID, Buyer.address)
                await utils.cancel(voucherID, Seller.address)
                await utils.finalize(voucherID, Deployer.address)
                const withdrawTx = await utils.withdraw(voucherID, Deployer.address);

                truffleAssert.eventEmitted(withdrawTx, 'LogAmountDistribution', (ev) => {
                    utils.calcTotalAmountToRecipients(ev, distributedAmounts, '_to')
                    return true
                }, "Amounts not distributed successfully")


                assert.isTrue(distributedAmounts.buyerAmount.eq(expectedBuyerAmount), 'Buyer Amount is not as expected')
                assert.isTrue(distributedAmounts.sellerAmount.eq(expectedSellerAmount), 'Seller Amount is not as expected')
                assert.isTrue(distributedAmounts.escrowAmount.eq(expectedEscrowAmount), 'Escrow Amount is not as expected')
            });

            it("COMMIT->REFUND->COMPLAIN->FINALIZE->WITHDRAW", async () => {
                const expectedBuyerAmount = new BN(helpers.product_price) // 0.3
                const expectedSellerAmount = new BN(0) // 0
                const expectedEscrowAmount = new BN(helpers.seller_deposit).add(new BN(helpers.buyer_deposit)) // 0.09

                const voucherID = await utils.commitToBuy(Buyer.address, Seller.address, TOKEN_SUPPLY_ID);
                await utils.refund(voucherID, Buyer.address)
                await utils.complain(voucherID, Buyer.address)
                await timemachine.advanceTimeSeconds(60);

                await utils.finalize(voucherID, Deployer.address)

                const withdrawTx = await utils.withdraw(voucherID, Deployer.address)

                truffleAssert.eventEmitted(withdrawTx, 'LogAmountDistribution', (ev) => {
                    utils.calcTotalAmountToRecipients(ev, distributedAmounts, '_to')
                    return true
                }, "Amounts not distributed successfully")


                assert.isTrue(distributedAmounts.buyerAmount.eq(expectedBuyerAmount), 'Buyer Amount is not as expected')
                assert.isTrue(distributedAmounts.sellerAmount.eq(expectedSellerAmount), 'Seller Amount is not as expected')
                assert.isTrue(distributedAmounts.escrowAmount.eq(expectedEscrowAmount), 'Escrow Amount is not as expected')
            });

            it("COMMIT->REFUND->CANCEL->FINALIZE->WITHDRAW", async () => {
                const expectedBuyerAmount = new BN(helpers.buyer_deposit).add(new BN(helpers.product_price)).add(new BN(helpers.seller_deposit).div(new BN(2))) // 0.3 + 0.04 + 0.025
                const expectedSellerAmount = new BN(helpers.seller_deposit).div(new BN(2)) // 0.025
                const expectedEscrowAmount = new BN(0) //0

                const voucherID = await utils.commitToBuy(Buyer.address, Seller.address, TOKEN_SUPPLY_ID)
                await utils.refund(voucherID, Buyer.address)
                await utils.cancel(voucherID, Seller.address)

                await timemachine.advanceTimeSeconds(60)

                await utils.finalize(voucherID, Deployer.address)

                const withdrawTx = await utils.withdraw(voucherID, Deployer.address);

                truffleAssert.eventEmitted(withdrawTx, 'LogAmountDistribution', (ev) => {
                    utils.calcTotalAmountToRecipients(ev, distributedAmounts, '_to')
                    return true
                }, "Amounts not distributed successfully")

                assert.isTrue(distributedAmounts.buyerAmount.eq(expectedBuyerAmount), 'Buyer Amount is not as expected')
                assert.isTrue(distributedAmounts.sellerAmount.eq(expectedSellerAmount), 'Seller Amount is not as expected')
                assert.isTrue(distributedAmounts.escrowAmount.eq(expectedEscrowAmount), 'Escrow Amount is not as expected')
            });

            it("COMMIT->REFUND->FINALIZE->WITHDRAW", async () => {
                const expectedBuyerAmount = new BN(helpers.product_price) // 0.3
                const expectedSellerAmount = new BN(helpers.seller_deposit) // 0.05
                const expectedEscrowAmount = new BN(helpers.buyer_deposit) // 0.04

                const voucherID = await utils.commitToBuy(Buyer.address, Seller.address, TOKEN_SUPPLY_ID)
                await utils.refund(voucherID, Buyer.address)

                await timemachine.advanceTimeSeconds(60)
                await utils.finalize(voucherID, Deployer.address)

                const withdrawTx = await utils.withdraw(voucherID, Deployer.address);

                truffleAssert.eventEmitted(withdrawTx, 'LogAmountDistribution', (ev) => {
                    utils.calcTotalAmountToRecipients(ev, distributedAmounts, '_to')
                    return true
                }, "Amounts not distributed successfully")

                assert.isTrue(distributedAmounts.buyerAmount.eq(expectedBuyerAmount), 'Buyer Amount is not as expected')
                assert.isTrue(distributedAmounts.sellerAmount.eq(expectedSellerAmount), 'Seller Amount is not as expected')
                assert.isTrue(distributedAmounts.escrowAmount.eq(expectedEscrowAmount), 'Escrow Amount is not as expected')
            });

            it("COMMIT->CANCEL->FINALIZE->WITHDRAW", async () => {
                const expectedBuyerAmount = new BN(helpers.buyer_deposit).add(new BN(helpers.product_price)).add(new BN(helpers.seller_deposit).div(new BN(2))) // 0.3 + 0.04 + 0.025
                const expectedSellerAmount = new BN(helpers.seller_deposit).div(new BN(2)) // 0.025
                const expectedEscrowAmount = new BN(0) // 0

                const voucherID = await utils.commitToBuy(Buyer.address, Seller.address, TOKEN_SUPPLY_ID)
                await utils.cancel(voucherID, Seller.address)

                await timemachine.advanceTimeSeconds(60)
                await utils.finalize(voucherID, Deployer.address)


                const withdrawTx = await utils.withdraw(voucherID, Deployer.address);

                truffleAssert.eventEmitted(withdrawTx, 'LogAmountDistribution', (ev) => {
                    utils.calcTotalAmountToRecipients(ev, distributedAmounts, '_to')
                    return true
                }, "Amounts not distributed successfully")

                assert.isTrue(distributedAmounts.buyerAmount.eq(expectedBuyerAmount), 'Buyer Amount is not as expected')
                assert.isTrue(distributedAmounts.sellerAmount.eq(expectedSellerAmount), 'Seller Amount is not as expected')
                assert.isTrue(distributedAmounts.escrowAmount.eq(expectedEscrowAmount), 'Escrow Amount is not as expected')
            });

            it("COMMIT->REDEEM->FINALIZE->WITHDRAW", async () => {
                const expectedBuyerAmount = new BN(helpers.buyer_deposit) // 0.04
                const expectedSellerAmount = new BN(helpers.seller_deposit).add(new BN(helpers.product_price)) // 0.35
                const expectedEscrowAmount = new BN(0) // 0

                const voucherID = await utils.commitToBuy(Buyer.address, Seller.address, TOKEN_SUPPLY_ID)
                await utils.redeem(voucherID, Buyer.address)

                await timemachine.advanceTimeSeconds(60)
                await utils.finalize(voucherID, Deployer.address)

                const withdrawTx = await utils.withdraw(voucherID, Deployer.address)

                truffleAssert.eventEmitted(withdrawTx, 'LogAmountDistribution', (ev) => {
                    utils.calcTotalAmountToRecipients(ev, distributedAmounts, '_to')
                    return true
                }, "Amounts not distributed successfully")

                assert.isTrue(distributedAmounts.buyerAmount.eq(expectedBuyerAmount), 'Buyer Amount is not as expected')
                assert.isTrue(distributedAmounts.sellerAmount.eq(expectedSellerAmount), 'Seller Amount is not as expected')
                assert.isTrue(distributedAmounts.escrowAmount.eq(expectedEscrowAmount), 'Escrow Amount is not as expected')
            });

            it("COMMIT->REDEEM->COMPLAIN->FINALIZE->WITHDRAW", async () => {
                const expectedBuyerAmount = new BN(helpers.buyer_deposit) // 0.04
                const expectedSellerAmount = new BN(helpers.product_price) // 0.3
                const expectedEscrowAmount = new BN(helpers.seller_deposit) // 0.05

                const voucherID = await utils.commitToBuy(Buyer.address, Seller.address, TOKEN_SUPPLY_ID)
                await utils.redeem(voucherID, Buyer.address)
                await utils.complain(voucherID, Buyer.address)

                await timemachine.advanceTimeSeconds(60)
                await utils.finalize(voucherID, Deployer.address)

                const withdrawTx = await utils.withdraw(voucherID, Deployer.address);

                truffleAssert.eventEmitted(withdrawTx, 'LogAmountDistribution', (ev) => {
                    utils.calcTotalAmountToRecipients(ev, distributedAmounts, '_to')
                    return true
                }, "Amounts not distributed successfully")

                assert.isTrue(distributedAmounts.buyerAmount.eq(expectedBuyerAmount), 'Buyer Amount is not as expected')
                assert.isTrue(distributedAmounts.sellerAmount.eq(expectedSellerAmount), 'Seller Amount is not as expected')
                assert.isTrue(distributedAmounts.escrowAmount.eq(expectedEscrowAmount), 'Escrow Amount is not as expected')
            });

            it("COMMIT->REDEEM->COMPLAIN->CANCEL->FINALIZE->WITHDRAW", async () => {
                const expectedBuyerAmount = new BN(helpers.buyer_deposit).add(new BN(helpers.seller_deposit).div(new BN(2))) // 0.065
                const expectedSellerAmount = new BN(helpers.product_price).add(new BN(helpers.seller_deposit).div(new BN(4))) // 0.3125 
                const expectedEscrowAmount = new BN(helpers.seller_deposit).div(new BN(4)) // 0.0125

                const voucherID = await utils.commitToBuy(Buyer.address, Seller.address, TOKEN_SUPPLY_ID);
                await utils.redeem(voucherID, Buyer.address)
                await utils.complain(voucherID, Buyer.address)
                await utils.cancel(voucherID, Seller.address)

                await timemachine.advanceTimeSeconds(60)
                await utils.finalize(voucherID, Deployer.address)

                const withdrawTx = await utils.withdraw(voucherID, Deployer.address);

                truffleAssert.eventEmitted(withdrawTx, 'LogAmountDistribution', (ev) => {
                    utils.calcTotalAmountToRecipients(ev, distributedAmounts, '_to')
                    return true
                }, "Amounts not distributed successfully")

                assert.isTrue(distributedAmounts.buyerAmount.eq(expectedBuyerAmount), 'Buyer Amount is not as expected')
                assert.isTrue(distributedAmounts.sellerAmount.eq(expectedSellerAmount), 'Seller Amount is not as expected')
                assert.isTrue(distributedAmounts.escrowAmount.eq(expectedEscrowAmount), 'Escrow Amount is not as expected')
            });

            it("COMMIT->REDEEM->CANCEL->FINALIZE->WITHDRAW", async () => {
                const expectedBuyerAmount = new BN(helpers.buyer_deposit).add(new BN(helpers.seller_deposit).div(new BN(2))) // 0.065
                const expectedSellerAmount = new BN(helpers.product_price).add(new BN(helpers.seller_deposit).div(new BN(2))) // 0.325
                const expectedEscrowAmount = new BN(0) // 0

                const voucherID = await utils.commitToBuy(Buyer.address, Seller.address, TOKEN_SUPPLY_ID);
                await utils.redeem(voucherID, Buyer.address)
                await utils.cancel(voucherID, Seller.address)

                await timemachine.advanceTimeSeconds(60)
                await utils.finalize(voucherID, Deployer.address)

                const withdrawTx = await utils.withdraw(voucherID, Deployer.address);

                truffleAssert.eventEmitted(withdrawTx, 'LogAmountDistribution', (ev) => {
                    utils.calcTotalAmountToRecipients(ev, distributedAmounts, '_to')
                    return true
                }, "Amounts not distributed successfully")

                assert.isTrue(distributedAmounts.buyerAmount.eq(expectedBuyerAmount), 'Buyer Amount is not as expected')
                assert.isTrue(distributedAmounts.sellerAmount.eq(expectedSellerAmount), 'Seller Amount is not as expected')
                assert.isTrue(distributedAmounts.escrowAmount.eq(expectedEscrowAmount), 'Escrow Amount is not as expected')
            });

            afterEach(() => {
                distributedAmounts = {
                    buyerAmount: new BN(0),
                    sellerAmount: new BN(0),
                    escrowAmount: new BN(0)
                }
            })
        })

        describe('TKN - TKN [WITH PERMIT]', async () => {
            let balanceBuyerFromPayment = new BN(0)
            let balanceBuyerFromDesosits = new BN(0)

            let balanceSellerFromPayment = new BN(0)
            let balanceSellerFromDesosits = new BN(0)

            let escrowBalanceFromPayment = new BN(0)
            let escrowBalanceFromDeposits = new BN(0)

            let cashierPaymentLeft = new BN(0)
            let cashierDepositLeft = new BN(0)


            async function getBalancesFromPiceTokenAndDepositToken() {
                balanceBuyerFromPayment = await utils.contractBSNTokenPrice.balanceOf(Buyer.address)
                balanceBuyerFromDesosits = await utils.contractBSNTokenDeposit.balanceOf(Buyer.address)

                balanceSellerFromPayment = await utils.contractBSNTokenPrice.balanceOf(Seller.address)
                balanceSellerFromDesosits = await utils.contractBSNTokenDeposit.balanceOf(Seller.address)

                escrowBalanceFromPayment = await utils.contractBSNTokenPrice.balanceOf(Deployer.address)
                escrowBalanceFromDeposits = await utils.contractBSNTokenDeposit.balanceOf(Deployer.address)

                cashierPaymentLeft = await utils.contractBSNTokenPrice.balanceOf(utils.contractCashier.address)
                cashierDepositLeft = await utils.contractBSNTokenDeposit.balanceOf(utils.contractCashier.address)
            }

            beforeEach(async () => {

                utils = UtilsBuilder
                    .NEW()
                    .ERC20withPermit()
                    .TKN_TKN()
                    .build(contractERC1155ERC721, contractVoucherKernel, contractCashier, contractBSNTokenPrice, contractBSNTokenDeposit)
                 
                const timestamp = await Utils.getCurrTimestamp()

                const supplyQty = 1
                const tokensToMint = new BN(helpers.seller_deposit).mul(new BN(supplyQty))

                await utils.mintTokens('contractBSNTokenDeposit', Seller.address, tokensToMint);
                await utils.mintTokens('contractBSNTokenPrice', Buyer.address, helpers.product_price);
                await utils.mintTokens('contractBSNTokenDeposit', Buyer.address, helpers.buyer_deposit);

                TOKEN_SUPPLY_ID = await utils.createOrder(
                    Seller,
                    timestamp, 
                    timestamp + helpers.SECONDS_IN_DAY,
                    helpers.seller_deposit,
                    supplyQty
                )
            })

            it("COMMIT->REFUND->COMPLAIN->CANCEL->FINALIZE->WITHDRAW", async () => {

                const voucherID = await utils.commitToBuy(
                    Buyer,
                    Seller,
                    TOKEN_SUPPLY_ID
                )

                await utils.refund(voucherID, Buyer.address)
                await utils.complain(voucherID, Buyer.address)
                await utils.cancel(voucherID, Seller.address)
                await utils.finalize(voucherID, Deployer.address)
                const withdrawTx = await utils.withdraw(voucherID, Deployer.address);

                const expectedBuyerPrice = new BN(helpers.product_price) // 0.3
                const expectedBuyerDeposit = new BN(helpers.buyer_deposit).add(new BN(helpers.seller_deposit).div(new BN(2))) // 0.065
                const expectedSellerPrice = new BN(0)
                const expectedSellerDeposit = new BN(helpers.seller_deposit).div(new BN(4)) // 0.0125
                const expectedEscrowAmountDeposit = new BN(helpers.seller_deposit).div(new BN(4)) // 0.0125
                const expectedEscrowAmountPrice = new BN(0)

                await getBalancesFromPiceTokenAndDepositToken();

                //Payments 
                assert.isTrue(balanceBuyerFromPayment.eq(expectedBuyerPrice), "Buyer did not get expected tokens from PriceTokenContract");
                assert.isTrue(balanceSellerFromPayment.eq(expectedSellerPrice), "Seller did not get expected tokens from PriceTokenContract");
                assert.isTrue(escrowBalanceFromPayment.eq(expectedEscrowAmountPrice), "Escrow did not get expected tokens from PriceTokenContract");
                
                //Deposits
                assert.isTrue(balanceBuyerFromDesosits.eq(expectedBuyerDeposit), "Buyer did not get expected tokens from DepositTokenContract");
                assert.isTrue(balanceSellerFromDesosits.eq(expectedSellerDeposit), "Seller did not get expected tokens from DepositTokenContract");
                assert.isTrue(escrowBalanceFromDeposits.eq(expectedEscrowAmountDeposit), "Buyer did not get expected tokens from DepositTokenContract");

                //Cashier Should be Empty
                assert.isTrue(cashierPaymentLeft.eq(new BN(0)), "Cashier Contract is not empty");
                assert.isTrue(cashierDepositLeft.eq(new BN(0)), "Cashier Contract is not empty");

                truffleAssert.eventEmitted(withdrawTx, 'LogAmountDistribution', (ev) => {
                    return true
                }, "Event LogAmountDistribution was not emitted")

            });

            it("COMMIT->REFUND->COMPLAIN->FINALIZE->WITHDRAW", async () => {
                const voucherID = await utils.commitToBuy(
                    Buyer,
                    Seller,
                    TOKEN_SUPPLY_ID
                )

                await utils.refund(voucherID, Buyer.address)
                await utils.complain(voucherID, Buyer.address)

                await timemachine.advanceTimeSeconds(60);
                await utils.finalize(voucherID, Deployer.address)

                const withdrawTx = await utils.withdraw(voucherID, Deployer.address)

                const expectedBuyerPrice = new BN(helpers.product_price) // 0.3
                const expectedBuyerDeposit = new BN(0)
                const expectedSellerPrice = new BN(0)
                const expectedSellerDeposit = new BN(0)
                const expectedEscrowAmountDeposit = new BN(helpers.seller_deposit).add(new BN(helpers.buyer_deposit)) // 0.09
                const expectedEscrowAmountPrice = new BN(0)

                await getBalancesFromPiceTokenAndDepositToken();

                //Payments 
                assert.isTrue(balanceBuyerFromPayment.eq(expectedBuyerPrice), "Buyer did not get expected tokens from PriceTokenContract");
                assert.isTrue(balanceSellerFromPayment.eq(expectedSellerPrice), "Seller did not get expected tokens from PriceTokenContract");
                assert.isTrue(escrowBalanceFromPayment.eq(expectedEscrowAmountPrice), "Escrow did not get expected tokens from PriceTokenContract");

                //Deposits
                assert.isTrue(balanceBuyerFromDesosits.eq(expectedBuyerDeposit), "Buyer did not get expected tokens from DepositTokenContract");
                assert.isTrue(balanceSellerFromDesosits.eq(expectedSellerDeposit), "Seller did not get expected tokens from DepositTokenContract");
                assert.isTrue(escrowBalanceFromDeposits.eq(expectedEscrowAmountDeposit), "Escrow did not get expected tokens from DepositTokenContract");

                //Cashier Should be Empty
                assert.isTrue(cashierPaymentLeft.eq(new BN(0)), "Cashier Contract is not empty");
                assert.isTrue(cashierDepositLeft.eq(new BN(0)), "Cashier Contract is not empty");

                truffleAssert.eventEmitted(withdrawTx, 'LogAmountDistribution', (ev) => {
                    return true
                }, "Event LogAmountDistribution was not emitted")

            });

            it("COMMIT->REFUND->CANCEL->FINALIZE->WITHDRAW", async () => {
                const voucherID = await utils.commitToBuy(
                    Buyer,
                    Seller,
                    TOKEN_SUPPLY_ID
                )

                await utils.refund(voucherID, Buyer.address)
                await utils.cancel(voucherID, Seller.address)

                await timemachine.advanceTimeSeconds(60)

                await utils.finalize(voucherID, Deployer.address)

                const withdrawTx = await utils.withdraw(voucherID, Deployer.address);

                const expectedBuyerPrice = new BN(helpers.product_price) // 0.3
                const expectedBuyerDeposit = new BN(helpers.buyer_deposit).add(new BN(helpers.seller_deposit).div(new BN(2))) // 0.065
                const expectedSellerPrice = new BN(0)
                const expectedSellerDeposit = new BN(helpers.seller_deposit).div(new BN(2)) // 0.025
                const expectedEscrowAmountDeposit = new BN(0)
                const expectedEscrowAmountPrice = new BN(0)

                await getBalancesFromPiceTokenAndDepositToken();

                //Payments 
                assert.isTrue(balanceBuyerFromPayment.eq(expectedBuyerPrice), "Buyer did not get expected tokens from PriceTokenContract");
                assert.isTrue(balanceSellerFromPayment.eq(expectedSellerPrice), "Seller did not get expected tokens from PriceTokenContract");
                assert.isTrue(escrowBalanceFromPayment.eq(expectedEscrowAmountPrice), "Escrow did not get expected tokens from PriceTokenContract");

                //Deposits
                assert.isTrue(balanceBuyerFromDesosits.eq(expectedBuyerDeposit), "Buyer did not get expected tokens from DepositTokenContract");
                assert.isTrue(balanceSellerFromDesosits.eq(expectedSellerDeposit), "Seller did not get expected tokens from DepositTokenContract");
                assert.isTrue(escrowBalanceFromDeposits.eq(expectedEscrowAmountDeposit), "Escrow did not get expected tokens from DepositTokenContract");

                //Cashier Should be Empty
                assert.isTrue(cashierPaymentLeft.eq(new BN(0)), "Cashier Contract is not empty");
                assert.isTrue(cashierDepositLeft.eq(new BN(0)), "Cashier Contract is not empty");

                truffleAssert.eventEmitted(withdrawTx, 'LogAmountDistribution', (ev) => {
                    return true
                }, "Event LogAmountDistribution was not emitted")
            });

            it("COMMIT->REFUND->FINALIZE->WITHDRAW", async () => {
                const voucherID = await utils.commitToBuy(
                    Buyer,
                    Seller,
                    TOKEN_SUPPLY_ID
                )
                await utils.refund(voucherID, Buyer.address)

                await timemachine.advanceTimeSeconds(60)
                await utils.finalize(voucherID, Deployer.address)

                const withdrawTx = await utils.withdraw(voucherID, Deployer.address);

                const expectedBuyerPrice = new BN(helpers.product_price) // 0.3
                const expectedBuyerDeposit = new BN(0)
                const expectedSellerPrice = new BN(0)
                const expectedSellerDeposit = new BN(helpers.seller_deposit) // 0.05
                const expectedEscrowAmountDeposit = new BN(helpers.buyer_deposit) // 0.04
                const expectedEscrowAmountPrice = new BN(0)

                await getBalancesFromPiceTokenAndDepositToken();

                //Payments 
                assert.isTrue(balanceBuyerFromPayment.eq(expectedBuyerPrice), "Buyer did not get expected tokens from PriceTokenContract");
                assert.isTrue(balanceSellerFromPayment.eq(expectedSellerPrice), "Seller did not get expected tokens from PriceTokenContract");
                assert.isTrue(escrowBalanceFromPayment.eq(expectedEscrowAmountPrice), "Escrow did not get expected tokens from PriceTokenContract");

                //Deposits
                assert.isTrue(balanceBuyerFromDesosits.eq(expectedBuyerDeposit), "Buyer did not get expected tokens from DepositTokenContract");
                assert.isTrue(balanceSellerFromDesosits.eq(expectedSellerDeposit), "Seller did not get expected tokens from DepositTokenContract");
                assert.isTrue(escrowBalanceFromDeposits.eq(expectedEscrowAmountDeposit), "Escrow did not get expected tokens from DepositTokenContract");

                //Cashier Should be Empty
                assert.isTrue(cashierPaymentLeft.eq(new BN(0)), "Cashier Contract is not empty");
                assert.isTrue(cashierDepositLeft.eq(new BN(0)), "Cashier Contract is not empty");
             

                truffleAssert.eventEmitted(withdrawTx, 'LogAmountDistribution', (ev) => {
                    return true
                }, "Event LogAmountDistribution was not emitted")
            });

            it("COMMIT->CANCEL->FINALIZE->WITHDRAW", async () => {
                const voucherID = await utils.commitToBuy(
                    Buyer,
                    Seller,
                    TOKEN_SUPPLY_ID
                )

                await utils.cancel(voucherID, Seller.address)

                await timemachine.advanceTimeSeconds(60)
                await utils.finalize(voucherID, Deployer.address)

                const withdrawTx = await utils.withdraw(voucherID, Deployer.address);

                const expectedBuyerPrice = new BN(helpers.product_price) // 0.3
                const expectedBuyerDeposit = new BN(helpers.buyer_deposit).add(new BN(helpers.seller_deposit).div(new BN(2))) // 0.065
                const expectedSellerPrice = new BN(0)
                const expectedSellerDeposit = new BN(helpers.seller_deposit).div(new BN(2)) // 0.025
                const expectedEscrowAmountPrice = new BN(0)
                const expectedEscrowAmountDeposit = new BN(0)

                await getBalancesFromPiceTokenAndDepositToken();

                //Payments 
                assert.isTrue(balanceBuyerFromPayment.eq(expectedBuyerPrice), "Buyer did not get expected tokens from PriceTokenContract");
                assert.isTrue(balanceSellerFromPayment.eq(expectedSellerPrice), "Seller did not get expected tokens from PriceTokenContract");
                assert.isTrue(escrowBalanceFromPayment.eq(expectedEscrowAmountPrice), "Escrow did not get expected tokens from PriceTokenContract");

                //Deposits
                assert.isTrue(balanceBuyerFromDesosits.eq(expectedBuyerDeposit), "Buyer did not get expected tokens from DepositTokenContract");
                assert.isTrue(balanceSellerFromDesosits.eq(expectedSellerDeposit), "Seller did not get expected tokens from DepositTokenContract");
                assert.isTrue(escrowBalanceFromDeposits.eq(expectedEscrowAmountDeposit), "Escrow did not get expected tokens from DepositTokenContract");

                //Cashier Should be Empty
                assert.isTrue(cashierPaymentLeft.eq(new BN(0)), "Cashier Contract is not empty");
                assert.isTrue(cashierDepositLeft.eq(new BN(0)), "Cashier Contract is not empty");

                truffleAssert.eventEmitted(withdrawTx, 'LogAmountDistribution', (ev) => {
                    return true
                }, "Event LogAmountDistribution was not emitted")
            });

            it("COMMIT->REDEEM->FINALIZE->WITHDRAW", async () => {
                const voucherID = await utils.commitToBuy(
                    Buyer,
                    Seller,
                    TOKEN_SUPPLY_ID
                )
                await utils.redeem(voucherID, Buyer.address)

                await timemachine.advanceTimeSeconds(60)
                await utils.finalize(voucherID, Deployer.address)

                const withdrawTx = await utils.withdraw(voucherID, Deployer.address)

                const expectedBuyerPrice = new BN(0) 
                const expectedBuyerDeposit = new BN(helpers.buyer_deposit) // 0.04
                const expectedSellerPrice = new BN(helpers.product_price) //// 0.3
                const expectedSellerDeposit = new BN(helpers.seller_deposit) // 0.05
                const expectedEscrowAmountDeposit = new BN(0) 
                const expectedEscrowAmountPrice = new BN(0)

                await getBalancesFromPiceTokenAndDepositToken();

                //Payments 
                assert.isTrue(balanceBuyerFromPayment.eq(expectedBuyerPrice), "Buyer did not get expected tokens from PriceTokenContract");
                assert.isTrue(balanceSellerFromPayment.eq(expectedSellerPrice), "Seller did not get expected tokens from PriceTokenContract");
                assert.isTrue(escrowBalanceFromPayment.eq(expectedEscrowAmountPrice), "Escrow did not get expected tokens from PriceTokenContract");

                //Deposits
                assert.isTrue(balanceBuyerFromDesosits.eq(expectedBuyerDeposit), "Buyer did not get expected tokens from DepositTokenContract");
                assert.isTrue(balanceSellerFromDesosits.eq(expectedSellerDeposit), "Seller did not get expected tokens from DepositTokenContract");
                assert.isTrue(escrowBalanceFromDeposits.eq(expectedEscrowAmountDeposit), "Escrow did not get expected tokens from DepositTokenContract");

                //Cashier Should be Empty
                assert.isTrue(cashierPaymentLeft.eq(new BN(0)), "Cashier Contract is not empty");
                assert.isTrue(cashierDepositLeft.eq(new BN(0)), "Cashier Contract is not empty");

                truffleAssert.eventEmitted(withdrawTx, 'LogAmountDistribution', (ev) => {
                    return true
                }, "Event LogAmountDistribution was not emitted")
            });

            it("COMMIT->REDEEM->COMPLAIN->FINALIZE->WITHDRAW", async () => {
                const voucherID = await utils.commitToBuy(
                    Buyer,
                    Seller,
                    TOKEN_SUPPLY_ID
                )

                await utils.redeem(voucherID, Buyer.address)
                await utils.complain(voucherID, Buyer.address)

                await timemachine.advanceTimeSeconds(60)
                await utils.finalize(voucherID, Deployer.address)

                const withdrawTx = await utils.withdraw(voucherID, Deployer.address);

                const expectedBuyerPrice = new BN(0)
                const expectedBuyerDeposit = new BN(helpers.buyer_deposit) // 0.04
                const expectedSellerPrice = new BN(helpers.product_price) // 0.3
                const expectedSellerDeposit = new BN(0) 
                const expectedEscrowAmountPrice = new BN(0)
                const expectedEscrowAmountDeposit = new BN(helpers.seller_deposit) // 0.05

                await getBalancesFromPiceTokenAndDepositToken();

                //Payments 
                assert.isTrue(balanceBuyerFromPayment.eq(expectedBuyerPrice), "Buyer did not get expected tokens from PriceTokenContract");
                assert.isTrue(balanceSellerFromPayment.eq(expectedSellerPrice), "Seller did not get expected tokens from PriceTokenContract");
                assert.isTrue(escrowBalanceFromPayment.eq(expectedEscrowAmountPrice), "Escrow did not get expected tokens from PriceTokenContract");

                //Deposits
                assert.isTrue(balanceBuyerFromDesosits.eq(expectedBuyerDeposit), "Buyer did not get expected tokens from DepositTokenContract");
                assert.isTrue(balanceSellerFromDesosits.eq(expectedSellerDeposit), "Seller did not get expected tokens from DepositTokenContract");
                assert.isTrue(escrowBalanceFromDeposits.eq(expectedEscrowAmountDeposit), "Escrow did not get expected tokens from DepositTokenContract");

                //Cashier Should be Empty
                assert.isTrue(cashierPaymentLeft.eq(new BN(0)), "Cashier Contract is not empty");
                assert.isTrue(cashierDepositLeft.eq(new BN(0)), "Cashier Contract is not empty");

                truffleAssert.eventEmitted(withdrawTx, 'LogAmountDistribution', (ev) => {
                    return true
                }, "Event LogAmountDistribution was not emitted")
            });

            it("COMMIT->REDEEM->COMPLAIN->CANCEL->FINALIZE->WITHDRAW", async () => {
                const voucherID = await utils.commitToBuy(
                    Buyer,
                    Seller,
                    TOKEN_SUPPLY_ID
                )
                await utils.redeem(voucherID, Buyer.address)
                await utils.complain(voucherID, Buyer.address)
                await utils.cancel(voucherID, Seller.address)

                await timemachine.advanceTimeSeconds(60)
                await utils.finalize(voucherID, Deployer.address)

                const withdrawTx = await utils.withdraw(voucherID, Deployer.address);

                const expectedBuyerPrice = new BN(0)
                const expectedBuyerDeposit = new BN(helpers.buyer_deposit).add(new BN(helpers.seller_deposit).div(new BN(2))) // 0.065
                const expectedSellerPrice = new BN(helpers.product_price) // 0.3
                const expectedSellerDeposit = new BN(helpers.seller_deposit).div(new BN(4)) // 0.0125
                const expectedEscrowAmountPrice = new BN(0)
                const expectedEscrowAmountDeposit = new BN(helpers.seller_deposit).div(new BN(4)) // 0.0125

                await getBalancesFromPiceTokenAndDepositToken();

                //Payments 
                assert.isTrue(balanceBuyerFromPayment.eq(expectedBuyerPrice), "Buyer did not get expected tokens from PriceTokenContract");
                assert.isTrue(balanceSellerFromPayment.eq(expectedSellerPrice), "Seller did not get expected tokens from PriceTokenContract");
                assert.isTrue(escrowBalanceFromPayment.eq(expectedEscrowAmountPrice), "Escrow did not get expected tokens from PriceTokenContract");

                //Deposits
                assert.isTrue(balanceBuyerFromDesosits.eq(expectedBuyerDeposit), "Buyer did not get expected tokens from DepositTokenContract");
                assert.isTrue(balanceSellerFromDesosits.eq(expectedSellerDeposit), "Seller did not get expected tokens from DepositTokenContract");
                assert.isTrue(escrowBalanceFromDeposits.eq(expectedEscrowAmountDeposit), "Buyer did not get expected tokens from DepositTokenContract");

                //Cashier Should be Empty
                assert.isTrue(cashierPaymentLeft.eq(new BN(0)), "Cashier Contract is not empty");
                assert.isTrue(cashierDepositLeft.eq(new BN(0)), "Cashier Contract is not empty");

                truffleAssert.eventEmitted(withdrawTx, 'LogAmountDistribution', (ev) => {
                    return true
                }, "Event LogAmountDistribution was not emitted")
            });

            it("COMMIT->REDEEM->CANCEL->FINALIZE->WITHDRAW", async () => {
                const voucherID = await utils.commitToBuy(
                    Buyer,
                    Seller,
                    TOKEN_SUPPLY_ID
                )

                await utils.redeem(voucherID, Buyer.address)
                await utils.cancel(voucherID, Seller.address)

                await timemachine.advanceTimeSeconds(60)
                await utils.finalize(voucherID, Deployer.address)

                const withdrawTx = await utils.withdraw(voucherID, Deployer.address);

                const expectedBuyerPrice = new BN(0)
                const expectedBuyerDeposit = new BN(helpers.buyer_deposit).add(new BN(helpers.seller_deposit).div(new BN(2))) // 0.065
                const expectedSellerPrice = new BN(helpers.product_price) // 0.3
                const expectedSellerDeposit = new BN(helpers.seller_deposit).div(new BN(2)) // 0.025
                const expectedEscrowAmountPrice = new BN(0)
                const expectedEscrowAmountDeposit = new BN(0)

                await getBalancesFromPiceTokenAndDepositToken();

                //Payments 
                assert.isTrue(balanceBuyerFromPayment.eq(expectedBuyerPrice), "Buyer did not get expected tokens from PriceTokenContract");
                assert.isTrue(balanceSellerFromPayment.eq(expectedSellerPrice), "Seller did not get expected tokens from PriceTokenContract");
                assert.isTrue(escrowBalanceFromPayment.eq(expectedEscrowAmountPrice), "Escrow did not get expected tokens from PriceTokenContract");

                //Deposits
                assert.isTrue(balanceBuyerFromDesosits.eq(expectedBuyerDeposit), "Buyer did not get expected tokens from DepositTokenContract");
                assert.isTrue(balanceSellerFromDesosits.eq(expectedSellerDeposit), "Seller did not get expected tokens from DepositTokenContract");
                assert.isTrue(escrowBalanceFromDeposits.eq(expectedEscrowAmountDeposit), "Escrow did not get expected tokens from DepositTokenContract");

                //Cashier Should be Empty
                assert.isTrue(cashierPaymentLeft.eq(new BN(0)), "Cashier Contract is not empty");
                assert.isTrue(cashierDepositLeft.eq(new BN(0)), "Cashier Contract is not empty");

                truffleAssert.eventEmitted(withdrawTx, 'LogAmountDistribution', (ev) => {
                    return true
                }, "Event LogAmountDistribution was not emitted")

                
            });

            afterEach(async () => {
                distributedAmounts = {
                    buyerAmount: new BN(0),
                    sellerAmount: new BN(0),
                    escrowAmount: new BN(0)
                }

                balanceBuyerFromPayment = new BN(0)
                balanceBuyerFromDesosits = new BN(0)

                balanceSellerFromPayment = new BN(0)
                balanceSellerFromDesosits = new BN(0)

                escrowBalanceFromPayment = new BN(0)
                escrowBalanceFromDeposits = new BN(0)

                cashierPaymentLeft = new BN(0)
                cashierDepositLeft = new BN(0)

                await giveAwayToRandom();
            })

        })
       
        describe('ETH - TKN [WITH PERMIT]', async () => {
            let balanceBuyerFromPayment = new BN(0)
            let balanceBuyerFromDesosits = new BN(0)

            let balanceSellerFromPayment = new BN(0)
            let balanceSellerFromDesosits = new BN(0)

            let escrowBalanceFromPayment = new BN(0)
            let escrowBalanceFromDeposits = new BN(0)

            let cashierPaymentLeft = new BN(0)
            let cashierDepositLeft = new BN(0)

            async function getBalancesDepositToken() {
                balanceBuyerFromDesosits = await utils.contractBSNTokenDeposit.balanceOf(Buyer.address)
                balanceSellerFromDesosits = await utils.contractBSNTokenDeposit.balanceOf(Seller.address)
                escrowBalanceFromDeposits = await utils.contractBSNTokenDeposit.balanceOf(Deployer.address)
                cashierDepositLeft = await utils.contractBSNTokenDeposit.balanceOf(utils.contractCashier.address)
            }

            beforeEach(async () => {

                utils = UtilsBuilder
                    .NEW()
                    .ERC20withPermit()
                    .ETH_TKN()
                    .build(contractERC1155ERC721, contractVoucherKernel, contractCashier, contractBSNTokenPrice, contractBSNTokenDeposit)

                const timestamp = await Utils.getCurrTimestamp()

                const supplyQty = 1
                const tokensToMint = new BN(helpers.seller_deposit).mul(new BN(supplyQty))

                await utils.mintTokens('contractBSNTokenDeposit', Seller.address, tokensToMint);
                await utils.mintTokens('contractBSNTokenDeposit', Buyer.address, helpers.buyer_deposit);

                TOKEN_SUPPLY_ID = await utils.createOrder(
                    Seller,
                    timestamp,
                    timestamp + helpers.SECONDS_IN_DAY,
                    helpers.seller_deposit,
                    supplyQty
                )
            })

            it("COMMIT->REFUND->COMPLAIN->CANCEL->FINALIZE->WITHDRAW", async () => {

                const voucherID = await utils.commitToBuy(
                    Buyer,
                    Seller,
                    TOKEN_SUPPLY_ID
                )

                await utils.refund(voucherID, Buyer.address)
                await utils.complain(voucherID, Buyer.address)
                await utils.cancel(voucherID, Seller.address)
                await utils.finalize(voucherID, Deployer.address)
                const withdrawTx = await utils.withdraw(voucherID, Deployer.address);

                const expectedBuyerPrice = new BN(helpers.product_price) // 0.3
                const expectedBuyerDeposit = new BN(helpers.buyer_deposit).add(new BN(helpers.seller_deposit).div(new BN(2))) // 0.065
                const expectedSellerDeposit = new BN(helpers.seller_deposit).div(new BN(4)) // 0.0125
                const expectedEscrowAmountDeposit = new BN(helpers.seller_deposit).div(new BN(4)) // 0.0125

                await getBalancesDepositToken();

                // Payment should have been returned to buyer
                truffleAssert.eventEmitted(withdrawTx, 'LogWithdrawal', (ev) => {

                    assert.equal(ev._payee, Buyer.address, "Incorrect Payee")
                    assert.isTrue(ev._payment.eq(expectedBuyerPrice))
                    
                    return true
                }, "Event LogAmountDistribution was not emitted")

                //Deposits
                assert.isTrue(balanceBuyerFromDesosits.eq(expectedBuyerDeposit), "Buyer did not get expected tokens from DepositTokenContract");
                assert.isTrue(balanceSellerFromDesosits.eq(expectedSellerDeposit), "Seller did not get expected tokens from DepositTokenContract");
                assert.isTrue(escrowBalanceFromDeposits.eq(expectedEscrowAmountDeposit), "Escrow did not get expected tokens from DepositTokenContract");

                //Cashier Should be Empty
                assert.isTrue(cashierPaymentLeft.eq(new BN(0)), "Cashier Contract is not empty");
                assert.isTrue(cashierDepositLeft.eq(new BN(0)), "Cashier Contract is not empty");

                truffleAssert.eventEmitted(withdrawTx, 'LogAmountDistribution', (ev) => {
                    return true
                }, "Event LogAmountDistribution was not emitted")

            });

            it("COMMIT->REFUND->COMPLAIN->FINALIZE->WITHDRAW", async () => {
                const voucherID = await utils.commitToBuy(
                    Buyer,
                    Seller,
                    TOKEN_SUPPLY_ID
                )

                await utils.refund(voucherID, Buyer.address)
                await utils.complain(voucherID, Buyer.address)

                await timemachine.advanceTimeSeconds(60);
                await utils.finalize(voucherID, Deployer.address)

                const withdrawTx = await utils.withdraw(voucherID, Deployer.address)

                const expectedBuyerPrice = new BN(helpers.product_price) // 0.3
                const expectedBuyerDeposit = new BN(0)
                const expectedSellerDeposit = new BN(0)
                const expectedEscrowAmountDeposit = new BN(helpers.seller_deposit).add(new BN(helpers.buyer_deposit)) // 0.09

                await getBalancesDepositToken();

                // Payment should have been returned to buyer
                truffleAssert.eventEmitted(withdrawTx, 'LogWithdrawal', (ev) => {

                    assert.equal(ev._payee, Buyer.address, "Incorrect Payee")
                    assert.isTrue(ev._payment.eq(expectedBuyerPrice))

                    return true
                }, "Event LogWithdrawal was not emitted")

                //Deposits
                assert.isTrue(balanceBuyerFromDesosits.eq(expectedBuyerDeposit), "Buyer did not get expected tokens from DepositTokenContract");
                assert.isTrue(balanceSellerFromDesosits.eq(expectedSellerDeposit), "Seller did not get expected tokens from DepositTokenContract");
                assert.isTrue(escrowBalanceFromDeposits.eq(expectedEscrowAmountDeposit), "Escrow did not get expected tokens from DepositTokenContract");

                //Cashier Should be Empty
                assert.isTrue(cashierPaymentLeft.eq(new BN(0)), "Cashier Contract is not empty");
                assert.isTrue(cashierDepositLeft.eq(new BN(0)), "Cashier Contract is not empty");

                truffleAssert.eventEmitted(withdrawTx, 'LogAmountDistribution', (ev) => {
                    return true
                }, "Event LogAmountDistribution was not emitted")

            });

            it("COMMIT->REFUND->CANCEL->FINALIZE->WITHDRAW", async () => {
                const voucherID = await utils.commitToBuy(
                    Buyer,
                    Seller,
                    TOKEN_SUPPLY_ID
                )

                await utils.refund(voucherID, Buyer.address)
                await utils.cancel(voucherID, Seller.address)

                await timemachine.advanceTimeSeconds(60)

                await utils.finalize(voucherID, Deployer.address)

                const withdrawTx = await utils.withdraw(voucherID, Deployer.address);

                const expectedBuyerPrice = new BN(helpers.product_price) // 0.3
                const expectedBuyerDeposit = new BN(helpers.buyer_deposit).add(new BN(helpers.seller_deposit).div(new BN(2))) // 0.065
                const expectedSellerDeposit = new BN(helpers.seller_deposit).div(new BN(2)) // 0.025
                const expectedEscrowAmountDeposit = new BN(0)

                await getBalancesDepositToken();

                // Payment should have been returned to buyer
                truffleAssert.eventEmitted(withdrawTx, 'LogWithdrawal', (ev) => {

                    assert.equal(ev._payee, Buyer.address, "Incorrect Payee")
                    assert.isTrue(ev._payment.eq(expectedBuyerPrice))

                    return true
                }, "Event LogWithdrawal was not emitted")

                //Deposits
                assert.isTrue(balanceBuyerFromDesosits.eq(expectedBuyerDeposit), "Buyer did not get expected tokens from DepositTokenContract");
                assert.isTrue(balanceSellerFromDesosits.eq(expectedSellerDeposit), "Seller did not get expected tokens from DepositTokenContract");
                assert.isTrue(escrowBalanceFromDeposits.eq(expectedEscrowAmountDeposit), "Escrow did not get expected tokens from DepositTokenContract");

                //Cashier Should be Empty
                assert.isTrue(cashierPaymentLeft.eq(new BN(0)), "Cashier Contract is not empty");
                assert.isTrue(cashierDepositLeft.eq(new BN(0)), "Cashier Contract is not empty");

                truffleAssert.eventEmitted(withdrawTx, 'LogAmountDistribution', (ev) => {
                    return true
                }, "Event LogAmountDistribution was not emitted")

            });

            it("COMMIT->REFUND->FINALIZE->WITHDRAW", async () => {
                const voucherID = await utils.commitToBuy(
                    Buyer,
                    Seller,
                    TOKEN_SUPPLY_ID
                )
                await utils.refund(voucherID, Buyer.address)

                await timemachine.advanceTimeSeconds(60)
                await utils.finalize(voucherID, Deployer.address)

                const withdrawTx = await utils.withdraw(voucherID, Deployer.address);

                const expectedBuyerPrice = new BN(helpers.product_price) // 0.3
                const expectedBuyerDeposit = new BN(0)
                const expectedSellerDeposit = new BN(helpers.seller_deposit) // 0.05
                const expectedEscrowAmountDeposit = new BN(helpers.buyer_deposit) // 0.04

                await getBalancesDepositToken();

                // Payment should have been returned to buyer
                truffleAssert.eventEmitted(withdrawTx, 'LogWithdrawal', (ev) => {

                    assert.equal(ev._payee, Buyer.address, "Incorrect Payee")
                    assert.isTrue(ev._payment.eq(expectedBuyerPrice))

                    return true
                }, "Event LogWithdrawal was not emitted")

                //Deposits
                assert.isTrue(balanceBuyerFromDesosits.eq(expectedBuyerDeposit), "Buyer did not get expected tokens from DepositTokenContract");
                assert.isTrue(balanceSellerFromDesosits.eq(expectedSellerDeposit), "Seller did not get expected tokens from DepositTokenContract");
                assert.isTrue(escrowBalanceFromDeposits.eq(expectedEscrowAmountDeposit), "Escrow did not get expected tokens from DepositTokenContract");

                //Cashier Should be Empty
                assert.isTrue(cashierPaymentLeft.eq(new BN(0)), "Cashier Contract is not empty");
                assert.isTrue(cashierDepositLeft.eq(new BN(0)), "Cashier Contract is not empty");


                truffleAssert.eventEmitted(withdrawTx, 'LogAmountDistribution', (ev) => {
                    return true
                }, "Event LogAmountDistribution was not emitted")
            });

            it("COMMIT->CANCEL->FINALIZE->WITHDRAW", async () => {
                const voucherID = await utils.commitToBuy(
                    Buyer,
                    Seller,
                    TOKEN_SUPPLY_ID
                )

                await utils.cancel(voucherID, Seller.address)

                await timemachine.advanceTimeSeconds(60)
                await utils.finalize(voucherID, Deployer.address)

                const withdrawTx = await utils.withdraw(voucherID, Deployer.address);

                const expectedBuyerPrice = new BN(helpers.product_price) // 0.3
                const expectedBuyerDeposit = new BN(helpers.buyer_deposit).add(new BN(helpers.seller_deposit).div(new BN(2))) // 0.065
                const expectedSellerDeposit = new BN(helpers.seller_deposit).div(new BN(2)) // 0.025
                const expectedEscrowAmountDeposit = new BN(0)

                await getBalancesDepositToken();

                // Payment should have been returned to buyer
                truffleAssert.eventEmitted(withdrawTx, 'LogWithdrawal', (ev) => {

                    assert.equal(ev._payee, Buyer.address, "Incorrect Payee")
                    assert.isTrue(ev._payment.eq(expectedBuyerPrice))

                    return true
                }, "Event LogWithdrawal was not emitted")

                //Deposits
                assert.isTrue(balanceBuyerFromDesosits.eq(expectedBuyerDeposit), "Buyer did not get expected tokens from DepositTokenContract");
                assert.isTrue(balanceSellerFromDesosits.eq(expectedSellerDeposit), "Seller did not get expected tokens from DepositTokenContract");
                assert.isTrue(escrowBalanceFromDeposits.eq(expectedEscrowAmountDeposit), "Escrow did not get expected tokens from DepositTokenContract");

                //Cashier Should be Empty
                assert.isTrue(cashierPaymentLeft.eq(new BN(0)), "Cashier Contract is not empty");
                assert.isTrue(cashierDepositLeft.eq(new BN(0)), "Cashier Contract is not empty");

                truffleAssert.eventEmitted(withdrawTx, 'LogAmountDistribution', (ev) => {
                    return true
                }, "Event LogAmountDistribution was not emitted")
            });

            it("COMMIT->REDEEM->FINALIZE->WITHDRAW", async () => {
                const voucherID = await utils.commitToBuy(
                    Buyer,
                    Seller,
                    TOKEN_SUPPLY_ID
                )
                await utils.redeem(voucherID, Buyer.address)

                await timemachine.advanceTimeSeconds(60)
                await utils.finalize(voucherID, Deployer.address)

                const withdrawTx = await utils.withdraw(voucherID, Deployer.address)

                const expectedBuyerDeposit = new BN(helpers.buyer_deposit) // 0.04
                const expectedSellerPrice = new BN(helpers.product_price) //// 0.3
                const expectedSellerDeposit = new BN(helpers.seller_deposit) // 0.05
                const expectedEscrowAmountDeposit = new BN(0)

                await getBalancesDepositToken();

                // Payment should have been sent to seller
                truffleAssert.eventEmitted(withdrawTx, 'LogWithdrawal', (ev) => {

                    assert.equal(ev._payee, Seller.address, "Incorrect Payee")
                    assert.isTrue(ev._payment.eq(expectedSellerPrice))

                    return true
                }, "Event LogWithdrawal was not emitted")

                //Deposits
                assert.isTrue(balanceBuyerFromDesosits.eq(expectedBuyerDeposit), "Buyer did not get expected tokens from DepositTokenContract");
                assert.isTrue(balanceSellerFromDesosits.eq(expectedSellerDeposit), "Seller did not get expected tokens from DepositTokenContract");
                assert.isTrue(escrowBalanceFromDeposits.eq(expectedEscrowAmountDeposit), "Escrow did not get expected tokens from DepositTokenContract");

                //Cashier Should be Empty
                assert.isTrue(cashierPaymentLeft.eq(new BN(0)), "Cashier Contract is not empty");
                assert.isTrue(cashierDepositLeft.eq(new BN(0)), "Cashier Contract is not empty");

                truffleAssert.eventEmitted(withdrawTx, 'LogAmountDistribution', (ev) => {
                    return true
                }, "Event LogAmountDistribution was not emitted")
            });

            it("COMMIT->REDEEM->COMPLAIN->FINALIZE->WITHDRAW", async () => {
                const voucherID = await utils.commitToBuy(
                    Buyer,
                   Seller,
                    TOKEN_SUPPLY_ID
                )

                await utils.redeem(voucherID, Buyer.address)
                await utils.complain(voucherID, Buyer.address)

                await timemachine.advanceTimeSeconds(60)
                await utils.finalize(voucherID, Deployer.address)

                const withdrawTx = await utils.withdraw(voucherID, Deployer.address);

                const expectedBuyerDeposit = new BN(helpers.buyer_deposit) // 0.04
                const expectedSellerPrice = new BN(helpers.product_price) // 0.3
                const expectedSellerDeposit = new BN(0)
                const expectedEscrowAmountDeposit = new BN(helpers.seller_deposit) // 0.05
                
                await getBalancesDepositToken();

                // Payment should have been sent to seller
                truffleAssert.eventEmitted(withdrawTx, 'LogWithdrawal', (ev) => {

                    assert.equal(ev._payee, Seller.address, "Incorrect Payee")
                    assert.isTrue(ev._payment.eq(expectedSellerPrice))

                    return true
                }, "Event LogWithdrawal was not emitted")

                //Deposits
                assert.isTrue(balanceBuyerFromDesosits.eq(expectedBuyerDeposit), "Buyer did not get expected tokens from DepositTokenContract");
                assert.isTrue(balanceSellerFromDesosits.eq(expectedSellerDeposit), "Seller did not get expected tokens from DepositTokenContract");
                assert.isTrue(escrowBalanceFromDeposits.eq(expectedEscrowAmountDeposit), "Escrow did not get expected tokens from DepositTokenContract");

                //Cashier Should be Empty
                assert.isTrue(cashierPaymentLeft.eq(new BN(0)), "Cashier Contract is not empty");
                assert.isTrue(cashierDepositLeft.eq(new BN(0)), "Cashier Contract is not empty");

                truffleAssert.eventEmitted(withdrawTx, 'LogAmountDistribution', (ev) => {
                    return true
                }, "Event LogAmountDistribution was not emitted")
            });

            it("COMMIT->REDEEM->COMPLAIN->CANCEL->FINALIZE->WITHDRAW", async () => {
                const voucherID = await utils.commitToBuy(
                    Buyer,
                    Seller,
                    TOKEN_SUPPLY_ID
                )
                await utils.redeem(voucherID, Buyer.address)
                await utils.complain(voucherID, Buyer.address)
                await utils.cancel(voucherID, Seller.address)

                await timemachine.advanceTimeSeconds(60)
                await utils.finalize(voucherID, Deployer.address)

                const withdrawTx = await utils.withdraw(voucherID, Deployer.address);

                const expectedBuyerDeposit = new BN(helpers.buyer_deposit).add(new BN(helpers.seller_deposit).div(new BN(2))) // 0.065
                const expectedSellerPrice = new BN(helpers.product_price) // 0.3
                const expectedSellerDeposit = new BN(helpers.seller_deposit).div(new BN(4)) // 0.0125
                const expectedEscrowAmountDeposit = new BN(helpers.seller_deposit).div(new BN(4)) // 0.0125

                await getBalancesDepositToken();

                // Payment should have been sent to seller
                truffleAssert.eventEmitted(withdrawTx, 'LogWithdrawal', (ev) => {

                    assert.equal(ev._payee, Seller.address, "Incorrect Payee")
                    assert.isTrue(ev._payment.eq(expectedSellerPrice))

                    return true
                }, "Event LogWithdrawal was not emitted")

                //Deposits
                assert.isTrue(balanceBuyerFromDesosits.eq(expectedBuyerDeposit), "Buyer did not get expected tokens from DepositTokenContract");
                assert.isTrue(balanceSellerFromDesosits.eq(expectedSellerDeposit), "Seller did not get expected tokens from DepositTokenContract");
                assert.isTrue(escrowBalanceFromDeposits.eq(expectedEscrowAmountDeposit), "Escrow did not get expected tokens from DepositTokenContract");

                //Cashier Should be Empty
                assert.isTrue(cashierPaymentLeft.eq(new BN(0)), "Cashier Contract is not empty");
                assert.isTrue(cashierDepositLeft.eq(new BN(0)), "Cashier Contract is not empty");

                truffleAssert.eventEmitted(withdrawTx, 'LogAmountDistribution', (ev) => {
                    return true
                }, "Event LogAmountDistribution was not emitted")
            });

            it("COMMIT->REDEEM->CANCEL->FINALIZE->WITHDRAW", async () => {
                const voucherID = await utils.commitToBuy(
                    Buyer,
                    Seller,
                    TOKEN_SUPPLY_ID
                )

                await utils.redeem(voucherID, Buyer.address)
                await utils.cancel(voucherID, Seller.address)

                await timemachine.advanceTimeSeconds(60)
                await utils.finalize(voucherID, Deployer.address)

                const withdrawTx = await utils.withdraw(voucherID, Deployer.address);

                const expectedBuyerDeposit = new BN(helpers.buyer_deposit).add(new BN(helpers.seller_deposit).div(new BN(2))) // 0.065
                const expectedSellerPrice = new BN(helpers.product_price) // 0.3
                const expectedSellerDeposit = new BN(helpers.seller_deposit).div(new BN(2)) // 0.025
                const expectedEscrowAmountDeposit = new BN(0)

                await getBalancesDepositToken();

                // Payment should have been sent to seller
                truffleAssert.eventEmitted(withdrawTx, 'LogWithdrawal', (ev) => {

                    assert.equal(ev._payee, Seller.address, "Incorrect Payee")
                    assert.isTrue(ev._payment.eq(expectedSellerPrice))

                    return true
                }, "Event LogWithdrawal was not emitted")

                //Deposits
                assert.isTrue(balanceBuyerFromDesosits.eq(expectedBuyerDeposit), "Buyer did not get expected tokens from DepositTokenContract");
                assert.isTrue(balanceSellerFromDesosits.eq(expectedSellerDeposit), "Seller did not get expected tokens from DepositTokenContract");
                assert.isTrue(escrowBalanceFromDeposits.eq(expectedEscrowAmountDeposit), "Escrow did not get expected tokens from DepositTokenContract");

                //Cashier Should be Empty
                assert.isTrue(cashierPaymentLeft.eq(new BN(0)), "Cashier Contract is not empty");
                assert.isTrue(cashierDepositLeft.eq(new BN(0)), "Cashier Contract is not empty");

                truffleAssert.eventEmitted(withdrawTx, 'LogAmountDistribution', (ev) => {
                    return true
                }, "Event LogAmountDistribution was not emitted")
            });

            afterEach(async () => {
                distributedAmounts = {
                    buyerAmount: new BN(0),
                    sellerAmount: new BN(0),
                    escrowAmount: new BN(0)
                }

                balanceBuyerFromPayment = new BN(0)
                balanceBuyerFromDesosits = new BN(0)

                balanceSellerFromPayment = new BN(0)
                balanceSellerFromDesosits = new BN(0)

                escrowBalanceFromPayment = new BN(0)
                escrowBalanceFromDeposits = new BN(0)

                cashierPaymentLeft = new BN(0)
                cashierDepositLeft = new BN(0)

                await giveAwayToRandom();
            })
        })

        describe('TKN - ETH [WITH PERMIT]', async () => {
            let balanceBuyerFromPayment = new BN(0)
            let balanceSellerFromPayment = new BN(0)
            let escrowBalanceFromPayment = new BN(0)

            let cashierPaymentLeft = new BN(0)
            let cashierDepositLeft = new BN(0)

            async function getBalancesPriceToken() {
                balanceBuyerFromPayment = await utils.contractBSNTokenPrice.balanceOf(Buyer.address)
                balanceSellerFromPayment = await utils.contractBSNTokenPrice.balanceOf(Seller.address)
                escrowBalanceFromPayment = await utils.contractBSNTokenPrice.balanceOf(Deployer.address)
                cashierPaymentLeft = await utils.contractBSNTokenPrice.balanceOf(utils.contractCashier.address)
            }

            beforeEach(async () => {

                utils = UtilsBuilder
                    .NEW()
                    .ERC20withPermit()
                    .TKN_ETH()
                    .build(contractERC1155ERC721, contractVoucherKernel, contractCashier, contractBSNTokenPrice, '')

                const timestamp = await Utils.getCurrTimestamp()

                const supplyQty = 1
                const tokensToMint = new BN(helpers.seller_deposit).mul(new BN(supplyQty))

                await utils.mintTokens('contractBSNTokenPrice', Buyer.address, helpers.product_price);

                TOKEN_SUPPLY_ID = await utils.createOrder(
                    Seller,
                    timestamp,
                    timestamp + helpers.SECONDS_IN_DAY,
                    helpers.seller_deposit,
                    supplyQty
                )
            })

            it("COMMIT->REFUND->COMPLAIN->CANCEL->FINALIZE->WITHDRAW", async () => {
                const voucherID = await utils.commitToBuy(
                    Buyer,
                    Seller,
                    TOKEN_SUPPLY_ID
                )

                await utils.refund(voucherID, Buyer.address)
                await utils.complain(voucherID, Buyer.address)
                await utils.cancel(voucherID, Seller.address)
                await utils.finalize(voucherID, Deployer.address)
                const withdrawTx = await utils.withdraw(voucherID, Deployer.address);

                const expectedBuyerPrice = new BN(helpers.product_price) // 0.3
                const expectedSellerPrice = new BN(0)
                const expectedEscrowPrice = new BN(0)
                const expectedBuyerDeposit = new BN(helpers.buyer_deposit).add(new BN(helpers.seller_deposit).div(new BN(2))) // 0.065
                const expectedSellerDeposit = new BN(helpers.seller_deposit).div(new BN(4)) // 0.0125
                const expectedEscrowAmountDeposit = new BN(helpers.seller_deposit).div(new BN(4)) // 0.0125

                await getBalancesPriceToken();

                // Payments in TKN
                // Payment should have been returned to buyer
                assert.isTrue(balanceBuyerFromPayment.eq(expectedBuyerPrice), "Buyer did not get expected tokens from PaymentTokenContract");
                assert.isTrue(balanceSellerFromPayment.eq(expectedSellerPrice), "Seller did not get expected tokens from PaymentTokenContract");
                assert.isTrue(escrowBalanceFromPayment.eq(expectedEscrowPrice), "Escrow did not get expected tokens from PaymentTokenContract");
                
                //Deposits in ETH
                truffleAssert.eventEmitted(withdrawTx, 'LogWithdrawal', (ev) => {
                    utils.calcTotalAmountToRecipients(ev, distributedAmounts, '_payee')
                    return true
                }, "Amounts not distributed successfully")
              
                assert.isTrue(distributedAmounts.buyerAmount.eq(expectedBuyerDeposit), 'Buyer Amount is not as expected')
                assert.isTrue(distributedAmounts.sellerAmount.eq(expectedSellerDeposit), 'Seller Amount is not as expected')
                assert.isTrue(distributedAmounts.escrowAmount.eq(expectedEscrowAmountDeposit), 'Escrow Amount is not as expected')

                //Cashier Should be Empty
                assert.isTrue(cashierPaymentLeft.eq(new BN(0)), "Cashier Contract is not empty");
                assert.isTrue(cashierDepositLeft.eq(new BN(0)), "Cashier Contract is not empty");

                truffleAssert.eventEmitted(withdrawTx, 'LogAmountDistribution', (ev) => {
                    return true
                }, "Event LogAmountDistribution was not emitted")

            });

            it("COMMIT->REFUND->COMPLAIN->FINALIZE->WITHDRAW", async () => {
                const voucherID = await utils.commitToBuy(
                    Buyer,
                    Seller,
                    TOKEN_SUPPLY_ID
                )

                await utils.refund(voucherID, Buyer.address)
                await utils.complain(voucherID, Buyer.address)

                await timemachine.advanceTimeSeconds(60);
                await utils.finalize(voucherID, Deployer.address)

                const withdrawTx = await utils.withdraw(voucherID, Deployer.address)

                const expectedBuyerPrice = new BN(helpers.product_price) // 0.3
                const expectedSellerPrice = new BN(0)
                const expectedEscrowPrice = new BN(0)
                const expectedBuyerDeposit = new BN(0)
                const expectedSellerDeposit = new BN(0)
                const expectedEscrowAmountDeposit = new BN(helpers.seller_deposit).add(new BN(helpers.buyer_deposit)) // 0.09

                await getBalancesPriceToken();

                // Payments in TKN
                // Payment should have been returned to buyer
                assert.isTrue(balanceBuyerFromPayment.eq(expectedBuyerPrice), "Buyer did not get expected tokens from PaymentTokenContract");
                assert.isTrue(balanceSellerFromPayment.eq(expectedSellerPrice), "Seller did not get expected tokens from PaymentTokenContract");
                assert.isTrue(escrowBalanceFromPayment.eq(expectedEscrowPrice), "Escrow did not get expected tokens from PaymentTokenContract");

                //Deposits in ETH
                truffleAssert.eventEmitted(withdrawTx, 'LogWithdrawal', (ev) => {
                    utils.calcTotalAmountToRecipients(ev, distributedAmounts, '_payee')
                    return true
                }, "Amounts not distributed successfully")

                assert.isTrue(distributedAmounts.buyerAmount.eq(expectedBuyerDeposit), 'Buyer Amount is not as expected')
                assert.isTrue(distributedAmounts.sellerAmount.eq(expectedSellerDeposit), 'Seller Amount is not as expected')
                assert.isTrue(distributedAmounts.escrowAmount.eq(expectedEscrowAmountDeposit), 'Escrow Amount is not as expected')

                //Cashier Should be Empty
                assert.isTrue(cashierPaymentLeft.eq(new BN(0)), "Cashier Contract is not empty");
                assert.isTrue(cashierDepositLeft.eq(new BN(0)), "Cashier Contract is not empty");

                truffleAssert.eventEmitted(withdrawTx, 'LogAmountDistribution', (ev) => {
                    return true
                }, "Event LogAmountDistribution was not emitted")

            });

            it("COMMIT->REFUND->CANCEL->FINALIZE->WITHDRAW", async () => {
                const voucherID = await utils.commitToBuy(
                    Buyer,
                    Seller,
                    TOKEN_SUPPLY_ID
                )

                await utils.refund(voucherID, Buyer.address)
                await utils.cancel(voucherID, Seller.address)

                await timemachine.advanceTimeSeconds(60)

                await utils.finalize(voucherID, Deployer.address)

                const withdrawTx = await utils.withdraw(voucherID, Deployer.address);

                const expectedBuyerPrice = new BN(helpers.product_price) // 0.3
                const expectedSellerPrice = new BN(0)
                const expectedEscrowPrice = new BN(0)
                const expectedBuyerDeposit = new BN(helpers.buyer_deposit).add(new BN(helpers.seller_deposit).div(new BN(2))) // 0.065
                const expectedSellerDeposit = new BN(helpers.seller_deposit).div(new BN(2)) // 0.025
                const expectedEscrowAmountDeposit = new BN(0)

                await getBalancesPriceToken();

                // Payments in TKN
                // Payment should have been returned to buyer
                assert.isTrue(balanceBuyerFromPayment.eq(expectedBuyerPrice), "Buyer did not get expected tokens from PaymentTokenContract");
                assert.isTrue(balanceSellerFromPayment.eq(expectedSellerPrice), "Seller did not get expected tokens from PaymentTokenContract");
                assert.isTrue(escrowBalanceFromPayment.eq(expectedEscrowPrice), "Escrow did not get expected tokens from PaymentTokenContract");

                //Deposits in ETH
                truffleAssert.eventEmitted(withdrawTx, 'LogWithdrawal', (ev) => {
                    utils.calcTotalAmountToRecipients(ev, distributedAmounts, '_payee')
                    return true
                }, "Amounts not distributed successfully")

                assert.isTrue(distributedAmounts.buyerAmount.eq(expectedBuyerDeposit), 'Buyer Amount is not as expected')
                assert.isTrue(distributedAmounts.sellerAmount.eq(expectedSellerDeposit), 'Seller Amount is not as expected')
                assert.isTrue(distributedAmounts.escrowAmount.eq(expectedEscrowAmountDeposit), 'Escrow Amount is not as expected')
                
                //Cashier Should be Empty
                assert.isTrue(cashierPaymentLeft.eq(new BN(0)), "Cashier Contract is not empty");
                assert.isTrue(cashierDepositLeft.eq(new BN(0)), "Cashier Contract is not empty");

                truffleAssert.eventEmitted(withdrawTx, 'LogAmountDistribution', (ev) => {
                    return true
                }, "Event LogAmountDistribution was not emitted")

            });

            it("COMMIT->REFUND->FINALIZE->WITHDRAW", async () => {
                const voucherID = await utils.commitToBuy(
                    Buyer,
                    Seller,
                    TOKEN_SUPPLY_ID
                )
                await utils.refund(voucherID, Buyer.address)

                await timemachine.advanceTimeSeconds(60)
                await utils.finalize(voucherID, Deployer.address)

                const withdrawTx = await utils.withdraw(voucherID, Deployer.address);

                const expectedBuyerPrice = new BN(helpers.product_price) // 0.3
                const expectedSellerPrice = new BN(0)
                const expectedEscrowPrice = new BN(0)
                const expectedBuyerDeposit = new BN(0)
                const expectedSellerDeposit = new BN(helpers.seller_deposit) // 0.05
                const expectedEscrowAmountDeposit = new BN(helpers.buyer_deposit) // 0.04

                await getBalancesPriceToken();

                // Payments in TKN
                // Payment should have been returned to buyer
                assert.isTrue(balanceBuyerFromPayment.eq(expectedBuyerPrice), "Buyer did not get expected tokens from PaymentTokenContract");
                assert.isTrue(balanceSellerFromPayment.eq(expectedSellerPrice), "Seller did not get expected tokens from PaymentTokenContract");
                assert.isTrue(escrowBalanceFromPayment.eq(expectedEscrowPrice), "Escrow did not get expected tokens from PaymentTokenContract");

                //Deposits in ETH
                truffleAssert.eventEmitted(withdrawTx, 'LogWithdrawal', (ev) => {
                    utils.calcTotalAmountToRecipients(ev, distributedAmounts, '_payee')
                    return true
                }, "Amounts not distributed successfully")

                assert.isTrue(distributedAmounts.buyerAmount.eq(expectedBuyerDeposit), 'Buyer Amount is not as expected')
                assert.isTrue(distributedAmounts.sellerAmount.eq(expectedSellerDeposit), 'Seller Amount is not as expected')
                assert.isTrue(distributedAmounts.escrowAmount.eq(expectedEscrowAmountDeposit), 'Escrow Amount is not as expected')

                //Cashier Should be Empty
                assert.isTrue(cashierPaymentLeft.eq(new BN(0)), "Cashier Contract is not empty");
                assert.isTrue(cashierDepositLeft.eq(new BN(0)), "Cashier Contract is not empty");


                truffleAssert.eventEmitted(withdrawTx, 'LogAmountDistribution', (ev) => {
                    return true
                }, "Event LogAmountDistribution was not emitted")
            });

            it("COMMIT->CANCEL->FINALIZE->WITHDRAW", async () => {
                const voucherID = await utils.commitToBuy(
                    Buyer,
                    Seller,
                    TOKEN_SUPPLY_ID
                )

                await utils.cancel(voucherID, Seller.address)

                await timemachine.advanceTimeSeconds(60)
                await utils.finalize(voucherID, Deployer.address)

                const withdrawTx = await utils.withdraw(voucherID, Deployer.address);

                const expectedBuyerPrice = new BN(helpers.product_price) // 0.3
                const expectedSellerPrice = new BN(0)
                const expectedEscrowPrice = new BN(0)
                const expectedBuyerDeposit = new BN(helpers.buyer_deposit).add(new BN(helpers.seller_deposit).div(new BN(2))) // 0.065
                const expectedSellerDeposit = new BN(helpers.seller_deposit).div(new BN(2)) // 0.025
                const expectedEscrowAmountDeposit = new BN(0)

                await getBalancesPriceToken();

                // Payments in TKN
                // Payment should have been returned to buyer
                assert.isTrue(balanceBuyerFromPayment.eq(expectedBuyerPrice), "Buyer did not get expected tokens from PaymentTokenContract");
                assert.isTrue(balanceSellerFromPayment.eq(expectedSellerPrice), "Seller did not get expected tokens from PaymentTokenContract");
                assert.isTrue(escrowBalanceFromPayment.eq(expectedEscrowPrice), "Escrow did not get expected tokens from PaymentTokenContract");

                //Deposits in ETH
                truffleAssert.eventEmitted(withdrawTx, 'LogWithdrawal', (ev) => {
                    utils.calcTotalAmountToRecipients(ev, distributedAmounts, '_payee')
                    return true
                }, "Amounts not distributed successfully")

                assert.isTrue(distributedAmounts.buyerAmount.eq(expectedBuyerDeposit), 'Buyer Amount is not as expected')
                assert.isTrue(distributedAmounts.sellerAmount.eq(expectedSellerDeposit), 'Seller Amount is not as expected')
                assert.isTrue(distributedAmounts.escrowAmount.eq(expectedEscrowAmountDeposit), 'Escrow Amount is not as expected')

                //Cashier Should be Empty
                assert.isTrue(cashierPaymentLeft.eq(new BN(0)), "Cashier Contract is not empty");
                assert.isTrue(cashierDepositLeft.eq(new BN(0)), "Cashier Contract is not empty");

                truffleAssert.eventEmitted(withdrawTx, 'LogAmountDistribution', (ev) => {
                    return true
                }, "Event LogAmountDistribution was not emitted")
            });

            it("COMMIT->REDEEM->FINALIZE->WITHDRAW", async () => {
                const voucherID = await utils.commitToBuy(
                    Buyer,
                    Seller,
                    TOKEN_SUPPLY_ID
                )
                await utils.redeem(voucherID, Buyer.address)

                await timemachine.advanceTimeSeconds(60)
                await utils.finalize(voucherID, Deployer.address)

                const withdrawTx = await utils.withdraw(voucherID, Deployer.address)

                const expectedBuyerPrice = new BN(0)
                const expectedSellerPrice = new BN(helpers.product_price) // 0.3
                const expectedEscrowPrice = new BN(0)
                const expectedBuyerDeposit = new BN(helpers.buyer_deposit) // 0.04
                const expectedSellerDeposit = new BN(helpers.seller_deposit) // 0.05
                const expectedEscrowAmountDeposit = new BN(0)

                await getBalancesPriceToken();

                // Payments in TKN
                // Payment should have been sent to seller
                assert.isTrue(balanceBuyerFromPayment.eq(expectedBuyerPrice), "Buyer did not get expected tokens from PaymentTokenContract");
                assert.isTrue(balanceSellerFromPayment.eq(expectedSellerPrice), "Seller did not get expected tokens from PaymentTokenContract");
                assert.isTrue(escrowBalanceFromPayment.eq(expectedEscrowPrice), "Escrow did not get expected tokens from PaymentTokenContract");

                //Deposits in ETH
                truffleAssert.eventEmitted(withdrawTx, 'LogWithdrawal', (ev) => {
                    utils.calcTotalAmountToRecipients(ev, distributedAmounts, '_payee')
                    return true
                }, "Amounts not distributed successfully")

                assert.isTrue(distributedAmounts.buyerAmount.eq(expectedBuyerDeposit), 'Buyer Amount is not as expected')
                assert.isTrue(distributedAmounts.sellerAmount.eq(expectedSellerDeposit), 'Seller Amount is not as expected')
                assert.isTrue(distributedAmounts.escrowAmount.eq(expectedEscrowAmountDeposit), 'Escrow Amount is not as expected')

                //Cashier Should be Empty
                assert.isTrue(cashierPaymentLeft.eq(new BN(0)), "Cashier Contract is not empty");
                assert.isTrue(cashierDepositLeft.eq(new BN(0)), "Cashier Contract is not empty");

                truffleAssert.eventEmitted(withdrawTx, 'LogAmountDistribution', (ev) => {
                    return true
                }, "Event LogAmountDistribution was not emitted")
            });

            it("COMMIT->REDEEM->COMPLAIN->FINALIZE->WITHDRAW", async () => {
                const voucherID = await utils.commitToBuy(
                    Buyer,
                    Seller,
                    TOKEN_SUPPLY_ID
                )

                await utils.redeem(voucherID, Buyer.address)
                await utils.complain(voucherID, Buyer.address)

                await timemachine.advanceTimeSeconds(60)
                await utils.finalize(voucherID, Deployer.address)

                const withdrawTx = await utils.withdraw(voucherID, Deployer.address);

                const expectedBuyerPrice = new BN(0)
                const expectedSellerPrice = new BN(helpers.product_price) // 0.3
                const expectedEscrowPrice = new BN(0)
                const expectedBuyerDeposit = new BN(helpers.buyer_deposit) // 0.04
                const expectedSellerDeposit = new BN(0)
                const expectedEscrowAmountDeposit = new BN(helpers.seller_deposit) // 0.05

                await getBalancesPriceToken();

                // Payments in TKN
                // Payment should have been sent to seller
                assert.isTrue(balanceBuyerFromPayment.eq(expectedBuyerPrice), "Buyer did not get expected tokens from PaymentTokenContract");
                assert.isTrue(balanceSellerFromPayment.eq(expectedSellerPrice), "Seller did not get expected tokens from PaymentTokenContract");
                assert.isTrue(escrowBalanceFromPayment.eq(expectedEscrowPrice), "Escrow did not get expected tokens from PaymentTokenContract");

                //Deposits in ETH
                truffleAssert.eventEmitted(withdrawTx, 'LogWithdrawal', (ev) => {
                    utils.calcTotalAmountToRecipients(ev, distributedAmounts, '_payee')
                    return true
                }, "Amounts not distributed successfully")

                assert.isTrue(distributedAmounts.buyerAmount.eq(expectedBuyerDeposit), 'Buyer Amount is not as expected')
                assert.isTrue(distributedAmounts.sellerAmount.eq(expectedSellerDeposit), 'Seller Amount is not as expected')
                assert.isTrue(distributedAmounts.escrowAmount.eq(expectedEscrowAmountDeposit), 'Escrow Amount is not as expected')

                //Cashier Should be Empty
                assert.isTrue(cashierPaymentLeft.eq(new BN(0)), "Cashier Contract is not empty");
                assert.isTrue(cashierDepositLeft.eq(new BN(0)), "Cashier Contract is not empty");

                truffleAssert.eventEmitted(withdrawTx, 'LogAmountDistribution', (ev) => {
                    return true
                }, "Event LogAmountDistribution was not emitted")
            });

            it("COMMIT->REDEEM->COMPLAIN->CANCEL->FINALIZE->WITHDRAW", async () => {
                const voucherID = await utils.commitToBuy(
                    Buyer,
                    Seller,
                    TOKEN_SUPPLY_ID
                )
                await utils.redeem(voucherID, Buyer.address)
                await utils.complain(voucherID, Buyer.address)
                await utils.cancel(voucherID, Seller.address)

                await timemachine.advanceTimeSeconds(60)
                await utils.finalize(voucherID, Deployer.address)

                const withdrawTx = await utils.withdraw(voucherID, Deployer.address);

                const expectedBuyerPrice = new BN(0)
                const expectedSellerPrice = new BN(helpers.product_price) // 0.3
                const expectedEscrowPrice = new BN(0)
                const expectedBuyerDeposit = new BN(helpers.buyer_deposit).add(new BN(helpers.seller_deposit).div(new BN(2))) // 0.065
                const expectedSellerDeposit = new BN(helpers.seller_deposit).div(new BN(4)) // 0.0125
                const expectedEscrowAmountDeposit = new BN(helpers.seller_deposit).div(new BN(4)) // 0.0125

                await getBalancesPriceToken();

                // Payments in TKN
                // Payment should have been sent to seller
                assert.isTrue(balanceBuyerFromPayment.eq(expectedBuyerPrice), "Buyer did not get expected tokens from PaymentTokenContract");
                assert.isTrue(balanceSellerFromPayment.eq(expectedSellerPrice), "Seller did not get expected tokens from PaymentTokenContract");
                assert.isTrue(escrowBalanceFromPayment.eq(expectedEscrowPrice), "Escrow did not get expected tokens from PaymentTokenContract");

                //Deposits in ETH
                truffleAssert.eventEmitted(withdrawTx, 'LogWithdrawal', (ev) => {
                    utils.calcTotalAmountToRecipients(ev, distributedAmounts, '_payee')
                    return true
                }, "Amounts not distributed successfully")

                assert.isTrue(distributedAmounts.buyerAmount.eq(expectedBuyerDeposit), 'Buyer Amount is not as expected')
                assert.isTrue(distributedAmounts.sellerAmount.eq(expectedSellerDeposit), 'Seller Amount is not as expected')
                assert.isTrue(distributedAmounts.escrowAmount.eq(expectedEscrowAmountDeposit), 'Escrow Amount is not as expected')

                //Cashier Should be Empty
                assert.isTrue(cashierPaymentLeft.eq(new BN(0)), "Cashier Contract is not empty");
                assert.isTrue(cashierDepositLeft.eq(new BN(0)), "Cashier Contract is not empty");

                truffleAssert.eventEmitted(withdrawTx, 'LogAmountDistribution', (ev) => {
                    return true
                }, "Event LogAmountDistribution was not emitted")
            });

            it("COMMIT->REDEEM->CANCEL->FINALIZE->WITHDRAW", async () => {
                const voucherID = await utils.commitToBuy(
                    Buyer,
                    Seller,
                    TOKEN_SUPPLY_ID
                )

                await utils.redeem(voucherID, Buyer.address)
                await utils.cancel(voucherID, Seller.address)

                await timemachine.advanceTimeSeconds(60)
                await utils.finalize(voucherID, Deployer.address)

                const withdrawTx = await utils.withdraw(voucherID, Deployer.address);

                const expectedBuyerPrice = new BN(0)
                const expectedSellerPrice = new BN(helpers.product_price) // 0.3
                const expectedEscrowPrice = new BN(0)
                const expectedBuyerDeposit = new BN(helpers.buyer_deposit).add(new BN(helpers.seller_deposit).div(new BN(2))) // 0.065
                const expectedSellerDeposit = new BN(helpers.seller_deposit).div(new BN(2)) // 0.025
                const expectedEscrowAmountDeposit = new BN(0)

                await getBalancesPriceToken();
                // Payments in TKN
                // Payment should have been sent to seller
                assert.isTrue(balanceBuyerFromPayment.eq(expectedBuyerPrice), "Buyer did not get expected tokens from PaymentTokenContract");
                assert.isTrue(balanceSellerFromPayment.eq(expectedSellerPrice), "Seller did not get expected tokens from PaymentTokenContract");
                assert.isTrue(escrowBalanceFromPayment.eq(expectedEscrowPrice), "Escrow did not get expected tokens from PaymentTokenContract");

                //Deposits in ETH
                truffleAssert.eventEmitted(withdrawTx, 'LogWithdrawal', (ev) => {
                    utils.calcTotalAmountToRecipients(ev, distributedAmounts, '_payee')
                    return true
                }, "Amounts not distributed successfully")

                assert.isTrue(distributedAmounts.buyerAmount.eq(expectedBuyerDeposit), 'Buyer Amount is not as expected')
                assert.isTrue(distributedAmounts.sellerAmount.eq(expectedSellerDeposit), 'Seller Amount is not as expected')
                assert.isTrue(distributedAmounts.escrowAmount.eq(expectedEscrowAmountDeposit), 'Escrow Amount is not as expected')

                //Cashier Should be Empty
                assert.isTrue(cashierPaymentLeft.eq(new BN(0)), "Cashier Contract is not empty");
                assert.isTrue(cashierDepositLeft.eq(new BN(0)), "Cashier Contract is not empty");

                truffleAssert.eventEmitted(withdrawTx, 'LogAmountDistribution', (ev) => {
                    return true
                }, "Event LogAmountDistribution was not emitted")
            });

            afterEach(async () => {
                distributedAmounts = {
                    buyerAmount: new BN(0),
                    sellerAmount: new BN(0),
                    escrowAmount: new BN(0)
                }

                balanceBuyerFromPayment = new BN(0)
                balanceSellerFromPayment = new BN(0)
                escrowBalanceFromPayment = new BN(0)

                cashierPaymentLeft = new BN(0)
                cashierDepositLeft = new BN(0)

                await giveAwayToRandom();
            })
        })

    })
})

