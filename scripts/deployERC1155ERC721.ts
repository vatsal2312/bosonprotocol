import * as hre from "hardhat";

const deploy = async () => {
  console.log('current network', hre.network.name);
  const [deployer] = await hre.ethers.getSigners();
  const deployerAddr = await deployer.getAddress();
  const deployerBalance = await deployer.getBalance();
  console.log('deployer', deployerAddr, 'balance', deployerBalance.toString());

  const ERC1155ERC721 = await hre.ethers.getContractFactory('ERC1155ERC721');
  const erc1155erc721 = await ERC1155ERC721.deploy();


  await erc1155erc721.deployed();
  console.log('erc1155erc721 deployed at:', erc1155erc721.address);

  console.log(`Please call 'npx hardhat verify --network ${hre.network.name} ${erc1155erc721.address}'`);

  let result;
  result = await erc1155erc721.setVoucherKernelAddress(deployerAddr);
  console.log('waiting for setVoucherKernelAddress transaction is complete ...');
  await result.wait();

  result = await erc1155erc721._setMetadataBase('https://metamall.levalleux.online/');
  console.log('waiting for _setMetadataBase transaction is complete ...');
  await result.wait();
  result = await erc1155erc721._set1155Route('metadata/');
  console.log('waiting for _set1155Route transaction is complete ...');
  await result.wait();
  result = await erc1155erc721._set721Route('metadata/');
  console.log('waiting for _set721Route transaction is complete ...');
  await result.wait();

  const recipient = '0x2EC98F3F99aa31d4439869Ad2466394b60cd4DFF';
  const id1155 = '87654321'
  const id721 ='1234';
  result = await erc1155erc721["mint(address,uint256,uint256,bytes)"](recipient, id1155, 99, 0);
  console.log('waiting for erc1155 minting transaction is complete ...');
  await result.wait();
  result = await erc1155erc721["mint(address,uint256)"](recipient, id721);
  console.log('waiting for erc721 minting transaction is complete ...');
  await result.wait();

  console.log('tokenURI(', id721, ')', await erc1155erc721.tokenURI(id721));
  console.log('uri(', id1155, ')', await erc1155erc721.uri(id1155));

  return;
}

deploy().then(() => {
  console.log('deploy completed');
}).catch (e => {
  console.error(e);
})