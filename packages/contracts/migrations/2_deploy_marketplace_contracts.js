const NordicEnergyToken = artifacts.require('./token/NordicEnergyToken.sol')
const V01_Marketplace = artifacts.require('./marketplace/V01_Marketplace.sol')
const MockNUSD = artifacts.require('./token/MockNUSD.sol')

module.exports = function(deployer, network) {
  return deployer.then(() => {
    return deployContracts(deployer, network)
  })
}

async function deployContracts(deployer, network) {
  const IS_DEV = network === 'development'

  // Initial supply of 1B tokens, in natural units.
  await deployer.deploy(NordicEnergyToken, '1000000000000000000000000000')

  await deployer.deploy(V01_Marketplace, NordicEnergyToken.address)

  if (IS_DEV) {
    await deployer.deploy(MockNUSD, "NordicEnergyDollar", "NUSD", "18", "1000000000000000000000000000")
  }

  //register the marketplace as a possible caller upon token approval
  const token = await NordicEnergyToken.deployed()
  const contractOwner = await token.owner()
  await token.addCallSpenderWhitelist(V01_Marketplace.address, {from: contractOwner})

  if (IS_DEV) {
    await MockNUSD.deployed()
  }

}
