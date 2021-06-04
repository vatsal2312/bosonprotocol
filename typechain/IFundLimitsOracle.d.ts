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
  CallOverrides,
} from "ethers";
import { BytesLike } from "@ethersproject/bytes";
import { Listener, Provider } from "@ethersproject/providers";
import { FunctionFragment, EventFragment, Result } from "@ethersproject/abi";
import { TypedEventFilter, TypedEvent, TypedListener } from "./commons";

interface IFundLimitsOracleInterface extends ethers.utils.Interface {
  functions: {
    "getETHLimit()": FunctionFragment;
    "getTokenLimit(address)": FunctionFragment;
    "setETHLimit(uint256)": FunctionFragment;
    "setTokenLimit(address,uint256)": FunctionFragment;
  };

  encodeFunctionData(
    functionFragment: "getETHLimit",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "getTokenLimit",
    values: [string]
  ): string;
  encodeFunctionData(
    functionFragment: "setETHLimit",
    values: [BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "setTokenLimit",
    values: [string, BigNumberish]
  ): string;

  decodeFunctionResult(
    functionFragment: "getETHLimit",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getTokenLimit",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "setETHLimit",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "setTokenLimit",
    data: BytesLike
  ): Result;

  events: {};
}

export class IFundLimitsOracle extends BaseContract {
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

  interface: IFundLimitsOracleInterface;

  functions: {
    getETHLimit(overrides?: CallOverrides): Promise<[BigNumber]>;

    getTokenLimit(
      _tokenAddress: string,
      overrides?: CallOverrides
    ): Promise<[BigNumber]>;

    setETHLimit(
      _newLimit: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    setTokenLimit(
      _tokenAddress: string,
      _newLimit: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;
  };

  getETHLimit(overrides?: CallOverrides): Promise<BigNumber>;

  getTokenLimit(
    _tokenAddress: string,
    overrides?: CallOverrides
  ): Promise<BigNumber>;

  setETHLimit(
    _newLimit: BigNumberish,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  setTokenLimit(
    _tokenAddress: string,
    _newLimit: BigNumberish,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  callStatic: {
    getETHLimit(overrides?: CallOverrides): Promise<BigNumber>;

    getTokenLimit(
      _tokenAddress: string,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    setETHLimit(
      _newLimit: BigNumberish,
      overrides?: CallOverrides
    ): Promise<void>;

    setTokenLimit(
      _tokenAddress: string,
      _newLimit: BigNumberish,
      overrides?: CallOverrides
    ): Promise<void>;
  };

  filters: {};

  estimateGas: {
    getETHLimit(overrides?: CallOverrides): Promise<BigNumber>;

    getTokenLimit(
      _tokenAddress: string,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    setETHLimit(
      _newLimit: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    setTokenLimit(
      _tokenAddress: string,
      _newLimit: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;
  };

  populateTransaction: {
    getETHLimit(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    getTokenLimit(
      _tokenAddress: string,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    setETHLimit(
      _newLimit: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    setTokenLimit(
      _tokenAddress: string,
      _newLimit: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;
  };
}
