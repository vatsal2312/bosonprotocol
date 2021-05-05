import '@nomiclabs/hardhat-truffle5'
import '@typechain/hardhat'
import { HardhatUserConfig } from 'hardhat/types'
import "@nomiclabs/hardhat-ganache"
import "@nomiclabs/hardhat-waffle"
import "hardhat-gas-reporter"

const config: HardhatUserConfig = {
    defaultNetwork: 'hardhat',
    // allowUnlimitedContractSize: true,
    solidity: {
        compilers: [{ version: '0.7.1', settings: {
                optimizer: {
                    enabled: true,
                    runs: 200
                }
            } }],
    },
    typechain: {
        target: "truffle-v5",
    },
}

export default config