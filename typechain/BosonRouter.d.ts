/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import {
  ethers,
  EventFilter,
  Signer,
  BigNumber,
  BigNumberish,
  PopulatedTransaction,
  BaseContract,
  ContractTransaction,
  Overrides,
  PayableOverrides,
  CallOverrides,
} from "ethers";
import { BytesLike } from "@ethersproject/bytes";
import { Listener, Provider } from "@ethersproject/providers";
import { FunctionFragment, EventFragment, Result } from "@ethersproject/abi";
import { TypedEventFilter, TypedEvent, TypedListener } from "./commons";

interface BosonRouterInterface extends ethers.utils.Interface {
  functions: {
    "cancelOrFault(uint256)": FunctionFragment;
    "cashierAddress()": FunctionFragment;
    "complain(uint256)": FunctionFragment;
    "correlationIds(address)": FunctionFragment;
    "fundLimitsOracle()": FunctionFragment;
    "incrementCorrelationId(address)": FunctionFragment;
    "owner()": FunctionFragment;
    "pause()": FunctionFragment;
    "paused()": FunctionFragment;
    "redeem(uint256)": FunctionFragment;
    "refund(uint256)": FunctionFragment;
    "renounceOwnership()": FunctionFragment;
    "requestCancelOrFaultVoucherSet(uint256)": FunctionFragment;
    "requestCreateOrderETHETH(uint256[])": FunctionFragment;
    "requestCreateOrderETHTKNWithPermit(address,uint256,uint256,uint8,bytes32,bytes32,uint256[])": FunctionFragment;
    "requestCreateOrderTKNETH(address,uint256[])": FunctionFragment;
    "requestCreateOrderTKNTKNWithPermit(address,address,uint256,uint256,uint8,bytes32,bytes32,uint256[])": FunctionFragment;
    "requestVoucherETHETH(uint256,address)": FunctionFragment;
    "requestVoucherETHTKNWithPermit(uint256,address,uint256,uint256,uint8,bytes32,bytes32)": FunctionFragment;
    "requestVoucherTKNETHWithPermit(uint256,address,uint256,uint256,uint8,bytes32,bytes32)": FunctionFragment;
    "requestVoucherTKNTKNSameWithPermit(uint256,address,uint256,uint256,uint8,bytes32,bytes32)": FunctionFragment;
    "requestVoucherTKNTKNWithPermit(uint256,address,uint256,uint256,uint8,bytes32,bytes32,uint8,bytes32,bytes32)": FunctionFragment;
    "transferOwnership(address)": FunctionFragment;
    "unpause()": FunctionFragment;
    "voucherKernel()": FunctionFragment;
  };

  encodeFunctionData(
    functionFragment: "cancelOrFault",
    values: [BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "cashierAddress",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "complain",
    values: [BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "correlationIds",
    values: [string]
  ): string;
  encodeFunctionData(
    functionFragment: "fundLimitsOracle",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "incrementCorrelationId",
    values: [string]
  ): string;
  encodeFunctionData(functionFragment: "owner", values?: undefined): string;
  encodeFunctionData(functionFragment: "pause", values?: undefined): string;
  encodeFunctionData(functionFragment: "paused", values?: undefined): string;
  encodeFunctionData(
    functionFragment: "redeem",
    values: [BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "refund",
    values: [BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "renounceOwnership",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "requestCancelOrFaultVoucherSet",
    values: [BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "requestCreateOrderETHETH",
    values: [BigNumberish[]]
  ): string;
  encodeFunctionData(
    functionFragment: "requestCreateOrderETHTKNWithPermit",
    values: [
      string,
      BigNumberish,
      BigNumberish,
      BigNumberish,
      BytesLike,
      BytesLike,
      BigNumberish[]
    ]
  ): string;
  encodeFunctionData(
    functionFragment: "requestCreateOrderTKNETH",
    values: [string, BigNumberish[]]
  ): string;
  encodeFunctionData(
    functionFragment: "requestCreateOrderTKNTKNWithPermit",
    values: [
      string,
      string,
      BigNumberish,
      BigNumberish,
      BigNumberish,
      BytesLike,
      BytesLike,
      BigNumberish[]
    ]
  ): string;
  encodeFunctionData(
    functionFragment: "requestVoucherETHETH",
    values: [BigNumberish, string]
  ): string;
  encodeFunctionData(
    functionFragment: "requestVoucherETHTKNWithPermit",
    values: [
      BigNumberish,
      string,
      BigNumberish,
      BigNumberish,
      BigNumberish,
      BytesLike,
      BytesLike
    ]
  ): string;
  encodeFunctionData(
    functionFragment: "requestVoucherTKNETHWithPermit",
    values: [
      BigNumberish,
      string,
      BigNumberish,
      BigNumberish,
      BigNumberish,
      BytesLike,
      BytesLike
    ]
  ): string;
  encodeFunctionData(
    functionFragment: "requestVoucherTKNTKNSameWithPermit",
    values: [
      BigNumberish,
      string,
      BigNumberish,
      BigNumberish,
      BigNumberish,
      BytesLike,
      BytesLike
    ]
  ): string;
  encodeFunctionData(
    functionFragment: "requestVoucherTKNTKNWithPermit",
    values: [
      BigNumberish,
      string,
      BigNumberish,
      BigNumberish,
      BigNumberish,
      BytesLike,
      BytesLike,
      BigNumberish,
      BytesLike,
      BytesLike
    ]
  ): string;
  encodeFunctionData(
    functionFragment: "transferOwnership",
    values: [string]
  ): string;
  encodeFunctionData(functionFragment: "unpause", values?: undefined): string;
  encodeFunctionData(
    functionFragment: "voucherKernel",
    values?: undefined
  ): string;

  decodeFunctionResult(
    functionFragment: "cancelOrFault",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "cashierAddress",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "complain", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "correlationIds",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "fundLimitsOracle",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "incrementCorrelationId",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "owner", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "pause", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "paused", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "redeem", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "refund", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "renounceOwnership",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "requestCancelOrFaultVoucherSet",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "requestCreateOrderETHETH",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "requestCreateOrderETHTKNWithPermit",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "requestCreateOrderTKNETH",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "requestCreateOrderTKNTKNWithPermit",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "requestVoucherETHETH",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "requestVoucherETHTKNWithPermit",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "requestVoucherTKNETHWithPermit",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "requestVoucherTKNTKNSameWithPermit",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "requestVoucherTKNTKNWithPermit",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "transferOwnership",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "unpause", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "voucherKernel",
    data: BytesLike
  ): Result;

  events: {
    "LogOrderCreated(uint256,address,uint256,uint8,uint256)": EventFragment;
    "OwnershipTransferred(address,address)": EventFragment;
    "Paused(address)": EventFragment;
    "Unpaused(address)": EventFragment;
  };

  getEvent(nameOrSignatureOrTopic: "LogOrderCreated"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "OwnershipTransferred"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "Paused"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "Unpaused"): EventFragment;
}

export class BosonRouter extends BaseContract {
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  listeners<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter?: TypedEventFilter<EventArgsArray, EventArgsObject>
  ): Array<TypedListener<EventArgsArray, EventArgsObject>>;
  off<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter: TypedEventFilter<EventArgsArray, EventArgsObject>,
    listener: TypedListener<EventArgsArray, EventArgsObject>
  ): this;
  on<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter: TypedEventFilter<EventArgsArray, EventArgsObject>,
    listener: TypedListener<EventArgsArray, EventArgsObject>
  ): this;
  once<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter: TypedEventFilter<EventArgsArray, EventArgsObject>,
    listener: TypedListener<EventArgsArray, EventArgsObject>
  ): this;
  removeListener<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter: TypedEventFilter<EventArgsArray, EventArgsObject>,
    listener: TypedListener<EventArgsArray, EventArgsObject>
  ): this;
  removeAllListeners<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter: TypedEventFilter<EventArgsArray, EventArgsObject>
  ): this;

  listeners(eventName?: string): Array<Listener>;
  off(eventName: string, listener: Listener): this;
  on(eventName: string, listener: Listener): this;
  once(eventName: string, listener: Listener): this;
  removeListener(eventName: string, listener: Listener): this;
  removeAllListeners(eventName?: string): this;

  queryFilter<EventArgsArray extends Array<any>, EventArgsObject>(
    event: TypedEventFilter<EventArgsArray, EventArgsObject>,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TypedEvent<EventArgsArray & EventArgsObject>>>;

  interface: BosonRouterInterface;

  functions: {
    cancelOrFault(
      _tokenIdVoucher: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    cashierAddress(overrides?: CallOverrides): Promise<[string]>;

    complain(
      _tokenIdVoucher: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    correlationIds(
      arg0: string,
      overrides?: CallOverrides
    ): Promise<[BigNumber]>;

    fundLimitsOracle(overrides?: CallOverrides): Promise<[string]>;

    incrementCorrelationId(
      _party: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    owner(overrides?: CallOverrides): Promise<[string]>;

    pause(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    paused(overrides?: CallOverrides): Promise<[boolean]>;

    redeem(
      _tokenIdVoucher: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    refund(
      _tokenIdVoucher: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    renounceOwnership(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    requestCancelOrFaultVoucherSet(
      _tokenIdSupply: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    requestCreateOrderETHETH(
      metadata: BigNumberish[],
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    requestCreateOrderETHTKNWithPermit(
      _tokenDepositAddress: string,
      _tokensSent: BigNumberish,
      deadline: BigNumberish,
      v: BigNumberish,
      r: BytesLike,
      s: BytesLike,
      metadata: BigNumberish[],
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    requestCreateOrderTKNETH(
      _tokenPriceAddress: string,
      metadata: BigNumberish[],
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    requestCreateOrderTKNTKNWithPermit(
      _tokenPriceAddress: string,
      _tokenDepositAddress: string,
      _tokensSent: BigNumberish,
      deadline: BigNumberish,
      v: BigNumberish,
      r: BytesLike,
      s: BytesLike,
      metadata: BigNumberish[],
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    requestVoucherETHETH(
      _tokenIdSupply: BigNumberish,
      _issuer: string,
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    requestVoucherETHTKNWithPermit(
      _tokenIdSupply: BigNumberish,
      _issuer: string,
      _tokensDeposit: BigNumberish,
      deadline: BigNumberish,
      v: BigNumberish,
      r: BytesLike,
      s: BytesLike,
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    requestVoucherTKNETHWithPermit(
      _tokenIdSupply: BigNumberish,
      _issuer: string,
      _tokensPrice: BigNumberish,
      deadline: BigNumberish,
      v: BigNumberish,
      r: BytesLike,
      s: BytesLike,
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    requestVoucherTKNTKNSameWithPermit(
      _tokenIdSupply: BigNumberish,
      _issuer: string,
      _tokensSent: BigNumberish,
      deadline: BigNumberish,
      v: BigNumberish,
      r: BytesLike,
      s: BytesLike,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    requestVoucherTKNTKNWithPermit(
      _tokenIdSupply: BigNumberish,
      _issuer: string,
      _tokensSent: BigNumberish,
      deadline: BigNumberish,
      vPrice: BigNumberish,
      rPrice: BytesLike,
      sPrice: BytesLike,
      vDeposit: BigNumberish,
      rDeposit: BytesLike,
      sDeposit: BytesLike,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    transferOwnership(
      newOwner: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    unpause(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    voucherKernel(overrides?: CallOverrides): Promise<[string]>;
  };

  cancelOrFault(
    _tokenIdVoucher: BigNumberish,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  cashierAddress(overrides?: CallOverrides): Promise<string>;

  complain(
    _tokenIdVoucher: BigNumberish,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  correlationIds(arg0: string, overrides?: CallOverrides): Promise<BigNumber>;

  fundLimitsOracle(overrides?: CallOverrides): Promise<string>;

  incrementCorrelationId(
    _party: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  owner(overrides?: CallOverrides): Promise<string>;

  pause(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  paused(overrides?: CallOverrides): Promise<boolean>;

  redeem(
    _tokenIdVoucher: BigNumberish,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  refund(
    _tokenIdVoucher: BigNumberish,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  renounceOwnership(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  requestCancelOrFaultVoucherSet(
    _tokenIdSupply: BigNumberish,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  requestCreateOrderETHETH(
    metadata: BigNumberish[],
    overrides?: PayableOverrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  requestCreateOrderETHTKNWithPermit(
    _tokenDepositAddress: string,
    _tokensSent: BigNumberish,
    deadline: BigNumberish,
    v: BigNumberish,
    r: BytesLike,
    s: BytesLike,
    metadata: BigNumberish[],
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  requestCreateOrderTKNETH(
    _tokenPriceAddress: string,
    metadata: BigNumberish[],
    overrides?: PayableOverrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  requestCreateOrderTKNTKNWithPermit(
    _tokenPriceAddress: string,
    _tokenDepositAddress: string,
    _tokensSent: BigNumberish,
    deadline: BigNumberish,
    v: BigNumberish,
    r: BytesLike,
    s: BytesLike,
    metadata: BigNumberish[],
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  requestVoucherETHETH(
    _tokenIdSupply: BigNumberish,
    _issuer: string,
    overrides?: PayableOverrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  requestVoucherETHTKNWithPermit(
    _tokenIdSupply: BigNumberish,
    _issuer: string,
    _tokensDeposit: BigNumberish,
    deadline: BigNumberish,
    v: BigNumberish,
    r: BytesLike,
    s: BytesLike,
    overrides?: PayableOverrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  requestVoucherTKNETHWithPermit(
    _tokenIdSupply: BigNumberish,
    _issuer: string,
    _tokensPrice: BigNumberish,
    deadline: BigNumberish,
    v: BigNumberish,
    r: BytesLike,
    s: BytesLike,
    overrides?: PayableOverrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  requestVoucherTKNTKNSameWithPermit(
    _tokenIdSupply: BigNumberish,
    _issuer: string,
    _tokensSent: BigNumberish,
    deadline: BigNumberish,
    v: BigNumberish,
    r: BytesLike,
    s: BytesLike,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  requestVoucherTKNTKNWithPermit(
    _tokenIdSupply: BigNumberish,
    _issuer: string,
    _tokensSent: BigNumberish,
    deadline: BigNumberish,
    vPrice: BigNumberish,
    rPrice: BytesLike,
    sPrice: BytesLike,
    vDeposit: BigNumberish,
    rDeposit: BytesLike,
    sDeposit: BytesLike,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  transferOwnership(
    newOwner: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  unpause(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  voucherKernel(overrides?: CallOverrides): Promise<string>;

  callStatic: {
    cancelOrFault(
      _tokenIdVoucher: BigNumberish,
      overrides?: CallOverrides
    ): Promise<void>;

    cashierAddress(overrides?: CallOverrides): Promise<string>;

    complain(
      _tokenIdVoucher: BigNumberish,
      overrides?: CallOverrides
    ): Promise<void>;

    correlationIds(arg0: string, overrides?: CallOverrides): Promise<BigNumber>;

    fundLimitsOracle(overrides?: CallOverrides): Promise<string>;

    incrementCorrelationId(
      _party: string,
      overrides?: CallOverrides
    ): Promise<void>;

    owner(overrides?: CallOverrides): Promise<string>;

    pause(overrides?: CallOverrides): Promise<void>;

    paused(overrides?: CallOverrides): Promise<boolean>;

    redeem(
      _tokenIdVoucher: BigNumberish,
      overrides?: CallOverrides
    ): Promise<void>;

    refund(
      _tokenIdVoucher: BigNumberish,
      overrides?: CallOverrides
    ): Promise<void>;

    renounceOwnership(overrides?: CallOverrides): Promise<void>;

    requestCancelOrFaultVoucherSet(
      _tokenIdSupply: BigNumberish,
      overrides?: CallOverrides
    ): Promise<void>;

    requestCreateOrderETHETH(
      metadata: BigNumberish[],
      overrides?: CallOverrides
    ): Promise<void>;

    requestCreateOrderETHTKNWithPermit(
      _tokenDepositAddress: string,
      _tokensSent: BigNumberish,
      deadline: BigNumberish,
      v: BigNumberish,
      r: BytesLike,
      s: BytesLike,
      metadata: BigNumberish[],
      overrides?: CallOverrides
    ): Promise<void>;

    requestCreateOrderTKNETH(
      _tokenPriceAddress: string,
      metadata: BigNumberish[],
      overrides?: CallOverrides
    ): Promise<void>;

    requestCreateOrderTKNTKNWithPermit(
      _tokenPriceAddress: string,
      _tokenDepositAddress: string,
      _tokensSent: BigNumberish,
      deadline: BigNumberish,
      v: BigNumberish,
      r: BytesLike,
      s: BytesLike,
      metadata: BigNumberish[],
      overrides?: CallOverrides
    ): Promise<void>;

    requestVoucherETHETH(
      _tokenIdSupply: BigNumberish,
      _issuer: string,
      overrides?: CallOverrides
    ): Promise<void>;

    requestVoucherETHTKNWithPermit(
      _tokenIdSupply: BigNumberish,
      _issuer: string,
      _tokensDeposit: BigNumberish,
      deadline: BigNumberish,
      v: BigNumberish,
      r: BytesLike,
      s: BytesLike,
      overrides?: CallOverrides
    ): Promise<void>;

    requestVoucherTKNETHWithPermit(
      _tokenIdSupply: BigNumberish,
      _issuer: string,
      _tokensPrice: BigNumberish,
      deadline: BigNumberish,
      v: BigNumberish,
      r: BytesLike,
      s: BytesLike,
      overrides?: CallOverrides
    ): Promise<void>;

    requestVoucherTKNTKNSameWithPermit(
      _tokenIdSupply: BigNumberish,
      _issuer: string,
      _tokensSent: BigNumberish,
      deadline: BigNumberish,
      v: BigNumberish,
      r: BytesLike,
      s: BytesLike,
      overrides?: CallOverrides
    ): Promise<void>;

    requestVoucherTKNTKNWithPermit(
      _tokenIdSupply: BigNumberish,
      _issuer: string,
      _tokensSent: BigNumberish,
      deadline: BigNumberish,
      vPrice: BigNumberish,
      rPrice: BytesLike,
      sPrice: BytesLike,
      vDeposit: BigNumberish,
      rDeposit: BytesLike,
      sDeposit: BytesLike,
      overrides?: CallOverrides
    ): Promise<void>;

    transferOwnership(
      newOwner: string,
      overrides?: CallOverrides
    ): Promise<void>;

    unpause(overrides?: CallOverrides): Promise<void>;

    voucherKernel(overrides?: CallOverrides): Promise<string>;
  };

  filters: {
    LogOrderCreated(
      _tokenIdSupply?: BigNumberish | null,
      _seller?: null,
      _quantity?: null,
      _paymentType?: null,
      _correlationId?: null
    ): TypedEventFilter<
      [BigNumber, string, BigNumber, number, BigNumber],
      {
        _tokenIdSupply: BigNumber;
        _seller: string;
        _quantity: BigNumber;
        _paymentType: number;
        _correlationId: BigNumber;
      }
    >;

    OwnershipTransferred(
      previousOwner?: string | null,
      newOwner?: string | null
    ): TypedEventFilter<
      [string, string],
      { previousOwner: string; newOwner: string }
    >;

    Paused(account?: null): TypedEventFilter<[string], { account: string }>;

    Unpaused(account?: null): TypedEventFilter<[string], { account: string }>;
  };

  estimateGas: {
    cancelOrFault(
      _tokenIdVoucher: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    cashierAddress(overrides?: CallOverrides): Promise<BigNumber>;

    complain(
      _tokenIdVoucher: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    correlationIds(arg0: string, overrides?: CallOverrides): Promise<BigNumber>;

    fundLimitsOracle(overrides?: CallOverrides): Promise<BigNumber>;

    incrementCorrelationId(
      _party: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    owner(overrides?: CallOverrides): Promise<BigNumber>;

    pause(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    paused(overrides?: CallOverrides): Promise<BigNumber>;

    redeem(
      _tokenIdVoucher: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    refund(
      _tokenIdVoucher: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    renounceOwnership(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    requestCancelOrFaultVoucherSet(
      _tokenIdSupply: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    requestCreateOrderETHETH(
      metadata: BigNumberish[],
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    requestCreateOrderETHTKNWithPermit(
      _tokenDepositAddress: string,
      _tokensSent: BigNumberish,
      deadline: BigNumberish,
      v: BigNumberish,
      r: BytesLike,
      s: BytesLike,
      metadata: BigNumberish[],
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    requestCreateOrderTKNETH(
      _tokenPriceAddress: string,
      metadata: BigNumberish[],
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    requestCreateOrderTKNTKNWithPermit(
      _tokenPriceAddress: string,
      _tokenDepositAddress: string,
      _tokensSent: BigNumberish,
      deadline: BigNumberish,
      v: BigNumberish,
      r: BytesLike,
      s: BytesLike,
      metadata: BigNumberish[],
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    requestVoucherETHETH(
      _tokenIdSupply: BigNumberish,
      _issuer: string,
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    requestVoucherETHTKNWithPermit(
      _tokenIdSupply: BigNumberish,
      _issuer: string,
      _tokensDeposit: BigNumberish,
      deadline: BigNumberish,
      v: BigNumberish,
      r: BytesLike,
      s: BytesLike,
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    requestVoucherTKNETHWithPermit(
      _tokenIdSupply: BigNumberish,
      _issuer: string,
      _tokensPrice: BigNumberish,
      deadline: BigNumberish,
      v: BigNumberish,
      r: BytesLike,
      s: BytesLike,
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    requestVoucherTKNTKNSameWithPermit(
      _tokenIdSupply: BigNumberish,
      _issuer: string,
      _tokensSent: BigNumberish,
      deadline: BigNumberish,
      v: BigNumberish,
      r: BytesLike,
      s: BytesLike,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    requestVoucherTKNTKNWithPermit(
      _tokenIdSupply: BigNumberish,
      _issuer: string,
      _tokensSent: BigNumberish,
      deadline: BigNumberish,
      vPrice: BigNumberish,
      rPrice: BytesLike,
      sPrice: BytesLike,
      vDeposit: BigNumberish,
      rDeposit: BytesLike,
      sDeposit: BytesLike,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    transferOwnership(
      newOwner: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    unpause(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    voucherKernel(overrides?: CallOverrides): Promise<BigNumber>;
  };

  populateTransaction: {
    cancelOrFault(
      _tokenIdVoucher: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    cashierAddress(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    complain(
      _tokenIdVoucher: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    correlationIds(
      arg0: string,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    fundLimitsOracle(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    incrementCorrelationId(
      _party: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    owner(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    pause(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    paused(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    redeem(
      _tokenIdVoucher: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    refund(
      _tokenIdVoucher: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    renounceOwnership(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    requestCancelOrFaultVoucherSet(
      _tokenIdSupply: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    requestCreateOrderETHETH(
      metadata: BigNumberish[],
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    requestCreateOrderETHTKNWithPermit(
      _tokenDepositAddress: string,
      _tokensSent: BigNumberish,
      deadline: BigNumberish,
      v: BigNumberish,
      r: BytesLike,
      s: BytesLike,
      metadata: BigNumberish[],
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    requestCreateOrderTKNETH(
      _tokenPriceAddress: string,
      metadata: BigNumberish[],
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    requestCreateOrderTKNTKNWithPermit(
      _tokenPriceAddress: string,
      _tokenDepositAddress: string,
      _tokensSent: BigNumberish,
      deadline: BigNumberish,
      v: BigNumberish,
      r: BytesLike,
      s: BytesLike,
      metadata: BigNumberish[],
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    requestVoucherETHETH(
      _tokenIdSupply: BigNumberish,
      _issuer: string,
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    requestVoucherETHTKNWithPermit(
      _tokenIdSupply: BigNumberish,
      _issuer: string,
      _tokensDeposit: BigNumberish,
      deadline: BigNumberish,
      v: BigNumberish,
      r: BytesLike,
      s: BytesLike,
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    requestVoucherTKNETHWithPermit(
      _tokenIdSupply: BigNumberish,
      _issuer: string,
      _tokensPrice: BigNumberish,
      deadline: BigNumberish,
      v: BigNumberish,
      r: BytesLike,
      s: BytesLike,
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    requestVoucherTKNTKNSameWithPermit(
      _tokenIdSupply: BigNumberish,
      _issuer: string,
      _tokensSent: BigNumberish,
      deadline: BigNumberish,
      v: BigNumberish,
      r: BytesLike,
      s: BytesLike,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    requestVoucherTKNTKNWithPermit(
      _tokenIdSupply: BigNumberish,
      _issuer: string,
      _tokensSent: BigNumberish,
      deadline: BigNumberish,
      vPrice: BigNumberish,
      rPrice: BytesLike,
      sPrice: BytesLike,
      vDeposit: BigNumberish,
      rDeposit: BytesLike,
      sDeposit: BytesLike,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    transferOwnership(
      newOwner: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    unpause(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    voucherKernel(overrides?: CallOverrides): Promise<PopulatedTransaction>;
  };
}
