import { artifacts, contract } from 'hardhat'
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import BN from 'bn.js'

// chai.use(solidity);
chai.use(chaiAsPromised).should()
const { expect } = chai
const  ethereum  = require('ethereum-address');
const truffleAssert = require('truffle-assertions');
const constants = require('../testHelpers/constants');
const Users = require('../testHelpers/users');


import {FundLimitsOracleContract, FundLimitsOracleInstance} from "../types/truffle-contracts";
const FundLimitsOracle: FundLimitsOracleContract = artifacts.require('FundLimitsOracle');

import {ERC20WithPermitContract,ERC20WithPermitInstance} from "../types/truffle-contracts"
const ERC20WithPermitOracle : ERC20WithPermitContract = artifacts.require('mocks/ERC20WithPermit')

import {ERC1155ERC721Contract, ERC1155ERC721Instance} from "../types/truffle-contracts";
const ERC1155ERC721ContractOracle : ERC1155ERC721Contract = artifacts.require('ERC1155ERC721');

import {VoucherKernelContract,VoucherKernelInstance} from "../types/truffle-contracts"
const VoucherKernrelOracle : VoucherKernelContract = artifacts.require('VoucherKernel')

import {CashierContract, CashierInstance} from "../types/truffle-contracts";
const CashierContractOracle : CashierContract = artifacts.require('Cashier')

import {BosonRouterContract, BosonRouterInstance} from "../types/truffle-contracts";
import chalk from "chalk";
const BosonRouterContractOracle : BosonRouterContract = artifacts.require('BosonRouter')


contract ('FundLimitsOracle',(accounts : string[])=>{
    let fundlimitsOracle : FundLimitsOracleInstance
    let contracterc20withpermit : ERC20WithPermitInstance
    let contractERC1155ERC721 : ERC1155ERC721Instance
    let contractvoucherkernel : VoucherKernelInstance
    let contractcashier : CashierInstance
    let contractbosonrouter : BosonRouterInstance

    beforeEach(async  () =>{
        let log = console.log;
        let cb = chalk.blue;
        let cg = chalk.green;

        fundlimitsOracle = await FundLimitsOracle.new();
        contracterc20withpermit = await ERC20WithPermitOracle.new('BOSON','BOSON');
        contractERC1155ERC721 = await ERC1155ERC721ContractOracle.new();
        contractvoucherkernel = await VoucherKernrelOracle.new(contractERC1155ERC721.address);
        contractcashier = await CashierContractOracle.new(contractvoucherkernel.address);
        contractbosonrouter = await BosonRouterContractOracle.new(contractvoucherkernel.address,contractERC1155ERC721.address,fundlimitsOracle.address,contractcashier.address);

        // setting initial values
        await contractERC1155ERC721.setApprovalForAll(contractvoucherkernel.address, true);
        await contractERC1155ERC721.setVoucherKernelAddress(contractvoucherkernel.address);
        await contractERC1155ERC721.setBosonRouterAddress(contractbosonrouter.address);
        await contractvoucherkernel.setBosonRouterAddress(contractbosonrouter.address);
        await contractvoucherkernel.setCashierAddress(contractcashier.address);
        await contractcashier.setBosonRouterAddress(contractbosonrouter.address);


        log(cg("< :: DEPLOYED CONTRACTS :: >"));
        log(cb("FundLimitsOracle Contract Address : "), fundlimitsOracle.address);
        log(cb("ERC1155ERC721 Contract Address    : "), contractERC1155ERC721.address);
        log(cb("VoucherKernel Contract Address    : "), contractvoucherkernel.address);
        log(cb("Cashier Contract Address          : "), contractcashier.address);
        log(cb("Boson Router Contract Address     : "), contractbosonrouter.address);

        let seller   = accounts[0];
        let buyer    = accounts[1];
        let attacker = accounts[2];

        log(cg("< :: ACCOUNTS :: >"));
        log(cb("seller   : ")+seller)
        log(cb("buyer    : ")+buyer)
        log(cb("attacker : ")+attacker)

    })

    describe('Direct minting', function () {
        const attacker = accounts[2];
        it('must fail: unauthorized minting ERC-1155', async () => {
            await truffleAssert.reverts(
                contractERC1155ERC721.mint(attacker, 666, 1, []),
                truffleAssert.ErrorType.REVERT
            );
        });

        it('must fail: unauthorized minting ERC-721', async () => {
            await truffleAssert.reverts(
                contractERC1155ERC721.mint(attacker, 666,0,[]),
                truffleAssert.ErrorType.REVERT
            );
        });
    });


    // issue with VM reverting transaction
    describe('Create Voucher Set (ERC1155)', () =>{
        it('adding a new order', async  () => {

            // work around for BN
            const num256 = 42*10**18;
            const num000 = 0;
            const val = num256.toString();
            let zero = num000.toString()


            let txCreate = await contractbosonrouter.requestCreateOrderETHETH(
                [zero,zero,val,val,val,val],{
                    from:accounts[0],
                    // @ts-ignore
                    to:contractcashier.address,
                    value:val
                }
            )
            console.log(txCreate)
        })
    })


});
