import { artifacts, contract } from 'hardhat'
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'

import BN from 'bn.js'

// chai.use(solidity);
chai.use(chaiAsPromised).should()
const { expect } = chai
const  ethereum  = require('ethereum-address');

import {FundLimitsOracleContract, FundLimitsOracleInstance} from "../types/truffle-contracts";
const FundLimitsOracle: FundLimitsOracleContract = artifacts.require('FundLimitsOracle');

import {ERC20WithPermitContract,ERC20WithPermitInstance} from "../types/truffle-contracts"
const ERC20WithPermitOracle : ERC20WithPermitContract = artifacts.require('mocks/ERC20WithPermit')

contract ('FundLimitsOracle',(accounts : string[])=>{
    let fundlimitsOracle : FundLimitsOracleInstance
    let erc20withpermitOracle : ERC20WithPermitInstance

    beforeEach(async  () =>{
            fundlimitsOracle = await FundLimitsOracle.new();
            erc20withpermitOracle = await ERC20WithPermitOracle.new('BOSON','BOSON');
    })


    describe('Validate [setETH, getETH] Limit Functions ',async () => {

        const value = new BN(1);

        // validates if the set ETH Limit emits the event logETHLimitChanged and transaction happens
        it("set ETH limit [Fund Limits Oracle]", async () => {
            let result = (((await fundlimitsOracle.setETHLimit(value)).logs)[0]).event;
            assert(result=='LogETHLimitChanged');
            assert(await fundlimitsOracle.getETHLimit() == value)
        })
    })

    describe('Validate [setToken, getToken] Limit', async () => {

        const value = new BN(1);

        // validates if the erc20 with permit returns a valid address
        it('check [ERC20WithPermit] if deployed ', async () => {
            const tokenAddress = erc20withpermitOracle.address;
            expect(ethereum.isAddress(tokenAddress))
        })

        // validates if the set token limit is properly executed and the LogTokenLimitChanged event is triggered
        it('set Token Limit [Fund Limits Oracle, ERC20WithPermit]', async ()  => {
            let res = ((await fundlimitsOracle.setTokenLimit(erc20withpermitOracle.address,new BN(1))).logs[0]).event;
            assert(res == 'LogTokenLimitChanged')
        })

        // validates if the get token limit is returning a proper values
        it('get Token Limit [Fund Limits Oracle, ERC20WithPermit]', async ()  => {
            const result = await fundlimitsOracle.getTokenLimit(erc20withpermitOracle.address);
            assert(typeof (result) == typeof (value));
        })
    })

})
