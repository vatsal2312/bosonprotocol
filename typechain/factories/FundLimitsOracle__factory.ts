/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Signer, utils, Contract, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import type {
  FundLimitsOracle,
  FundLimitsOracleInterface,
} from "../FundLimitsOracle";

const _abi = [
  {
    inputs: [],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "_newLimit",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "address",
        name: "_triggeredBy",
        type: "address",
      },
    ],
    name: "LogETHLimitChanged",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "_newLimit",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "address",
        name: "_triggeredBy",
        type: "address",
      },
    ],
    name: "LogTokenLimitChanged",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "previousOwner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "newOwner",
        type: "address",
      },
    ],
    name: "OwnershipTransferred",
    type: "event",
  },
  {
    inputs: [],
    name: "getETHLimit",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_tokenAddress",
        type: "address",
      },
    ],
    name: "getTokenLimit",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "renounceOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_newLimit",
        type: "uint256",
      },
    ],
    name: "setETHLimit",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_tokenAddress",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "_newLimit",
        type: "uint256",
      },
    ],
    name: "setTokenLimit",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "newOwner",
        type: "address",
      },
    ],
    name: "transferOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

const _bytecode =
  "0x608060405234801561001057600080fd5b50600061001b610076565b600080546001600160a01b0319166001600160a01b0383169081178255604051929350917f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e0908290a350670de0b6b3a764000060015561007a565b3390565b61057d806100896000396000f3fe608060405234801561001057600080fd5b506004361061006d5760003560e01c80630f878aed146100725780635a860c871461008c578063715018a6146100b25780638695332f146100bc5780638da5cb5b146100d9578063bc017637146100fd578063f2fde38b14610129575b600080fd5b61007a61014f565b60408051918252519081900360200190f35b61007a600480360360208110156100a257600080fd5b50356001600160a01b0316610155565b6100ba610170565b005b6100ba600480360360208110156100d257600080fd5b503561020a565b6100e16102be565b604080516001600160a01b039092168252519081900360200190f35b6100ba6004803603604081101561011357600080fd5b506001600160a01b0381351690602001356102cd565b6100ba6004803603602081101561013f57600080fd5b50356001600160a01b03166103ed565b60015490565b6001600160a01b031660009081526002602052604090205490565b6101786104dd565b6001600160a01b03166101896102be565b6001600160a01b0316146101d2576040805162461bcd60e51b81526020600482018190526024820152600080516020610508833981519152604482015290519081900360640190fd5b600080546040516001600160a01b0390911690600080516020610528833981519152908390a3600080546001600160a01b0319169055565b6102126104dd565b6001600160a01b03166102236102be565b6001600160a01b03161461026c576040805162461bcd60e51b81526020600482018190526024820152600080516020610508833981519152604482015290519081900360640190fd5b60018190557f9462735486103805dd471af708689460124c6d5016a7b7f897f887cf7020c5218161029b6102be565b604080519283526001600160a01b0390911660208301528051918290030190a150565b6000546001600160a01b031690565b6102d56104dd565b6001600160a01b03166102e66102be565b6001600160a01b03161461032f576040805162461bcd60e51b81526020600482018190526024820152600080516020610508833981519152604482015290519081900360640190fd5b816001600160a01b038116610383576040805162461bcd60e51b8152602060048201526015602482015274494e56414c49445f544f4b454e5f4144445245535360581b604482015290519081900360640190fd5b6001600160a01b03831660009081526002602052604090208290557f6a209be2fe222988596b5f4dd242289077f0f05402d2f1848a97da68c2353894826103c86102be565b604080519283526001600160a01b0390911660208301528051918290030190a1505050565b6103f56104dd565b6001600160a01b03166104066102be565b6001600160a01b03161461044f576040805162461bcd60e51b81526020600482018190526024820152600080516020610508833981519152604482015290519081900360640190fd5b6001600160a01b0381166104945760405162461bcd60e51b81526004018080602001828103825260268152602001806104e26026913960400191505060405180910390fd5b600080546040516001600160a01b038085169392169160008051602061052883398151915291a3600080546001600160a01b0319166001600160a01b0392909216919091179055565b339056fe4f776e61626c653a206e6577206f776e657220697320746865207a65726f20616464726573734f776e61626c653a2063616c6c6572206973206e6f7420746865206f776e65728be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e0a264697066735822122091ec3c20b14232ad91a20fc8c1f41ce4a07fb1d359ae96d3c217c1a2e41654ef64736f6c63430007010033";

export class FundLimitsOracle__factory extends ContractFactory {
  constructor(signer?: Signer) {
    super(_abi, _bytecode, signer);
  }

  deploy(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<FundLimitsOracle> {
    return super.deploy(overrides || {}) as Promise<FundLimitsOracle>;
  }
  getDeployTransaction(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(overrides || {});
  }
  attach(address: string): FundLimitsOracle {
    return super.attach(address) as FundLimitsOracle;
  }
  connect(signer: Signer): FundLimitsOracle__factory {
    return super.connect(signer) as FundLimitsOracle__factory;
  }
  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): FundLimitsOracleInterface {
    return new utils.Interface(_abi) as FundLimitsOracleInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): FundLimitsOracle {
    return new Contract(address, _abi, signerOrProvider) as FundLimitsOracle;
  }
}
