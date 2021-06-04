/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { ethers } from "ethers";
import {
  FactoryOptions,
  HardhatEthersHelpers as HardhatEthersHelpersBase,
} from "@nomiclabs/hardhat-ethers/types";

import * as Contracts from ".";

declare module "hardhat/types/runtime" {
  interface HardhatEthersHelpers extends HardhatEthersHelpersBase {
    getContractFactory(
      name: "AccessControl",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.AccessControl__factory>;
    getContractFactory(
      name: "Ownable",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.Ownable__factory>;
    getContractFactory(
      name: "IERC20",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.IERC20__factory>;
    getContractFactory(
      name: "Pausable",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.Pausable__factory>;
    getContractFactory(
      name: "BosonRouter",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.BosonRouter__factory>;
    getContractFactory(
      name: "Cashier",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.Cashier__factory>;
    getContractFactory(
      name: "ERC1155ERC721",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.ERC1155ERC721__factory>;
    getContractFactory(
      name: "FundLimitsOracle",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.FundLimitsOracle__factory>;
    getContractFactory(
      name: "IBosonRouter",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.IBosonRouter__factory>;
    getContractFactory(
      name: "ICashier",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.ICashier__factory>;
    getContractFactory(
      name: "IERC1155",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.IERC1155__factory>;
    getContractFactory(
      name: "IERC1155ERC721",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.IERC1155ERC721__factory>;
    getContractFactory(
      name: "ERC1155TokenReceiver",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.ERC1155TokenReceiver__factory>;
    getContractFactory(
      name: "IERC165",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.IERC165__factory>;
    getContractFactory(
      name: "IERC20WithPermit",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.IERC20WithPermit__factory>;
    getContractFactory(
      name: "IERC721",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.IERC721__factory>;
    getContractFactory(
      name: "ERC721TokenReceiver",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.ERC721TokenReceiver__factory>;
    getContractFactory(
      name: "IFundLimitsOracle",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.IFundLimitsOracle__factory>;
    getContractFactory(
      name: "IVoucherKernel",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.IVoucherKernel__factory>;
    getContractFactory(
      name: "Migrations",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.Migrations__factory>;
    getContractFactory(
      name: "ERC20WithPermit",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.ERC20WithPermit__factory>;
    getContractFactory(
      name: "MockERC20Permit",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.MockERC20Permit__factory>;
    getContractFactory(
      name: "UsingHelpers",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.UsingHelpers__factory>;
    getContractFactory(
      name: "VoucherKernel",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.VoucherKernel__factory>;

    // default types
    getContractFactory(
      name: string,
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<ethers.ContractFactory>;
    getContractFactory(
      abi: any[],
      bytecode: ethers.utils.BytesLike,
      signer?: ethers.Signer
    ): Promise<ethers.ContractFactory>;
  }
}
