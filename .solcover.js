module.exports = {
    port: 8555,
    testCommand: 'mocha --timeout 5000',
    measureStatementCoverage: false,
    providerOptions: {
        // Default Accounts with preminted 10ETH
        accounts: [
            { secretKey: '0x7ab741b57e8d94dd7e1a29055646bafde7010f38a900f55bbd7647880faa6ee8',
              balance: "0x8ac7230489e80000" 
            },
            { secretKey: '0x2030b463177db2da82908ef90fa55ddfcef56e8183caf60db464bc398e736e6f',
              balance: "0x8ac7230489e80000" 
            },
            { secretKey: '0x62ecd49c4ccb41a70ad46532aed63cf815de15864bc415c87d507afd6a5e8da2',
              balance: "0x8ac7230489e80000" 
            },
            { secretKey: '0xf473040b1a83739a9c7cc1f5719fab0f5bf178f83314d98557c58aae1910e03a',
              balance: "0x8ac7230489e80000" 
            },
            { secretKey: '0x823d590ed2cb5e8493bb0efc834771c1cde36f9fc49b9fe3620ebd0754ad6ea2',
              balance: "0x8ac7230489e80000" 
            },
            { secretKey: '0xd6d710943471e4c37ceb787857e7a2b41ca57f9cb4307ee9a9b21436a8e709c3',
              balance: "0x8ac7230489e80000" 
            },
            { secretKey: '0x187bb12e927c1652377405f81d93ce948a593f7d66cfba383ee761858b05921a',
              balance: "0x8ac7230489e80000" 
            },
            { secretKey: '0xf41486fdb04505e7966c8720a353ed92ce0d6830f8a5e915fbde735106a06d25',
              balance: "0x8ac7230489e80000" 
            },
            { secretKey: '0x6ca40ba4cca775643398385022264c0c414da1abd21d08d9e7136796a520a543',
              balance: "0x8ac7230489e80000" 
            },
            { secretKey: '0xfac0bc9325ad342033afe956e83f0bf8f1e863c1c3e956bc75d66961fe4cd186',
              balance: "0x8ac7230489e80000" 
            },
        ]
    }
};