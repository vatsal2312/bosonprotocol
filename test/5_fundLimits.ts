import {ethers} from 'hardhat';
import {Signer, ContractFactory, Contract} from 'ethers';

import {assert, expect} from 'chai';

import constants from '../testHelpers/constants';

import Users from '../testHelpers/users';
import Utils from '../testHelpers/utils';

import {
  BosonRouter,
  ERC1155ERC721,
  VoucherKernel,
  Cashier,
  TokenRegistry,
  MockERC20Permit,
} from '../typechain';

let ERC1155ERC721_Factory: ContractFactory;
let VoucherKernel_Factory: ContractFactory;
let Cashier_Factory: ContractFactory;
let BosonRouter_Factory: ContractFactory;
let TokenRegistry_Factory: ContractFactory;
let MockERC20Permit_Factory: ContractFactory;

import revertReasons from '../testHelpers/revertReasons';
import * as eventUtils from '../testHelpers/events';
const eventNames = eventUtils.eventNames;

let users;

describe('TokenRegistry', () => {
  before(async () => {
    const signers: Signer[] = await ethers.getSigners();
    users = new Users(signers);

    ERC1155ERC721_Factory = await ethers.getContractFactory('ERC1155ERC721');
    VoucherKernel_Factory = await ethers.getContractFactory('VoucherKernel');
    Cashier_Factory = await ethers.getContractFactory('Cashier');
    BosonRouter_Factory = await ethers.getContractFactory('BosonRouter');
    TokenRegistry_Factory = await ethers.getContractFactory('TokenRegistry');
    MockERC20Permit_Factory = await ethers.getContractFactory(
      'MockERC20Permit'
    );
  });

  let contractERC1155ERC721: ERC1155ERC721,
    contractVoucherKernel: VoucherKernel,
    contractCashier: Cashier,
    contractBosonRouter: BosonRouter,
    contractBSNTokenPrice: MockERC20Permit,
    contractTokenRegistry: TokenRegistry;

  let expectedLimit;

  const FIVE_ETHERS = (5 * 10 ** 18).toString();
  const FIVE_TOKENS = (5 * 10 ** 16).toString();

  async function deployContracts() {
    const timestamp = await Utils.getCurrTimestamp();

    constants.PROMISE_VALID_FROM = timestamp;
    constants.PROMISE_VALID_TO = timestamp + 2 * constants.SECONDS_IN_DAY;

    const sixtySeconds = 60;

    contractTokenRegistry = (await TokenRegistry_Factory.deploy()) as Contract &
      TokenRegistry;
    contractERC1155ERC721 = (await ERC1155ERC721_Factory.deploy()) as Contract &
      ERC1155ERC721;
    contractVoucherKernel = (await VoucherKernel_Factory.deploy(
      contractERC1155ERC721.address
    )) as Contract & VoucherKernel;
    contractCashier = (await Cashier_Factory.deploy(
      contractVoucherKernel.address
    )) as Contract & Cashier;
    contractBosonRouter = (await BosonRouter_Factory.deploy(
      contractVoucherKernel.address,
      contractTokenRegistry.address,
      contractCashier.address
    )) as Contract & BosonRouter;

    contractBSNTokenPrice = (await MockERC20Permit_Factory.deploy(
      'BosonTokenPrice',
      'BPRC'
    )) as Contract & MockERC20Permit;

    await contractTokenRegistry.deployed();
    await contractERC1155ERC721.deployed();
    await contractVoucherKernel.deployed();
    await contractCashier.deployed();
    await contractBosonRouter.deployed();
    await contractBSNTokenPrice.deployed();

    await contractERC1155ERC721.setApprovalForAll(
      contractVoucherKernel.address,
      true
    );
    await contractERC1155ERC721.setVoucherKernelAddress(
      contractVoucherKernel.address
    );

    await contractERC1155ERC721.setCashierAddress(contractCashier.address);

    await contractVoucherKernel.setBosonRouterAddress(
      contractBosonRouter.address
    );
    await contractVoucherKernel.setCashierAddress(contractCashier.address);

    await contractCashier.setBosonRouterAddress(contractBosonRouter.address);
    await contractCashier.setTokenContractAddress(
      contractERC1155ERC721.address
    );

    await contractVoucherKernel.setComplainPeriod(sixtySeconds);
    await contractVoucherKernel.setCancelFaultPeriod(sixtySeconds);
  }

  describe('TokenRegistry interaction', () => {
    before(async () => {
      await deployContracts();
    });

    describe('ETH', () => {
      it('Should have set ETH Limit initially to 1 ETH', async () => {
        const ONE_ETH = (10 ** 18).toString();

        const ethLimit = await contractTokenRegistry.getETHLimit();

        assert.equal(
          ethLimit.toString(),
          ONE_ETH,
          'ETH Limit not set properly'
        );
      });

      it('Owner should change ETH Limit', async () => {
        await contractTokenRegistry.setETHLimit(FIVE_ETHERS);

        expectedLimit = await contractTokenRegistry.getETHLimit();

        assert.equal(
          expectedLimit.toString(),
          FIVE_ETHERS,
          'ETH Limit not correctly set'
        );
      });

      it('Should emit LogETHLimitChanged', async () => {
        const setLimitTx = await contractTokenRegistry.setETHLimit(FIVE_ETHERS);

        const receipt = await setLimitTx.wait();

        eventUtils.assertEventEmitted(
          receipt,
          TokenRegistry_Factory,
          eventNames.LOG_ETH_LIMIT_CHANGED,
          (ev) => {
            assert.equal(ev._triggeredBy, users.deployer.address);
          }
        );
      });

      it('[NEGATIVE] Should revert if attacker tries to change ETH Limit', async () => {
        const attackerInstance = contractTokenRegistry.connect(
          users.attacker.signer
        );
        await expect(
          attackerInstance.setETHLimit(FIVE_ETHERS)
        ).to.be.revertedWith(revertReasons.UNAUTHORIZED_OWNER);
      });
    });

    describe('Token', () => {
      it('Owner should set Token Limit', async () => {
        await contractTokenRegistry.setTokenLimit(
          contractBSNTokenPrice.address,
          FIVE_TOKENS
        );

        expectedLimit = await contractTokenRegistry.getTokenLimit(
          contractBSNTokenPrice.address
        );

        assert.equal(
          expectedLimit.toString(),
          FIVE_TOKENS,
          'ETH Limit not correctly set'
        );
      });

      it('Should emit LogTokenLimitChanged', async () => {
        const setLimitTx = await contractTokenRegistry.setTokenLimit(
          contractBSNTokenPrice.address,
          FIVE_TOKENS
        );

        const txReceipt = await setLimitTx.wait();

        eventUtils.assertEventEmitted(
          txReceipt,
          TokenRegistry_Factory,
          eventNames.LOG_TOKEN_LIMIT_CHANGED,
          (ev) => {
            assert.equal(ev._triggeredBy, users.deployer.address);
          }
        );
      });

      it(
        '[NEGATIVE] Should revert if attacker tries to change ' + 'Token Limit',
        async () => {
          const attackerInstance = contractTokenRegistry.connect(
            users.attacker.signer
          );
          await expect(
            attackerInstance.setTokenLimit(
              contractBSNTokenPrice.address,
              FIVE_TOKENS
            )
          ).to.be.revertedWith(revertReasons.UNAUTHORIZED_OWNER);
        }
      );
    });
  });
});
