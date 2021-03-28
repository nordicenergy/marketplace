require('dotenv').config()

const fetch = require('node-fetch')
const { getLogger } = require('./utils/logger')

const log = getLogger('config')

const Defaults = {
  999: {
    ipfsGateway: 'http://localhost:8080',
    ipfsApi: `http://localhost:${process.env.IPFS_API_PORT || 5002}`,
    provider: 'http://localhost:8545',
    providerWs: 'ws://localhost:8545',
    marketplaceContract: process.env.MARKETPLACE_CONTRACT
  },
  4: {
    ipfsGateway: 'https://fs-autossl.staging.nordicenergy.io',
    ipfsApi: 'https://fs.staging.nordicenergy.io',
    marketplaceContract: '0x0c92804F7C7DE65d62E52D43D79747d97FAda607',
    fetchPastLogs: true
  },
  1: {
    ipfsGateway: 'https://fs-autossl.nordicenergy.io',
    ipfsApi: 'https://fs.nordicenergy.io',
    marketplaceContract: '0xb99F2f73da66898bc40006D0E419B294217fa3Aa',
    fetchPastLogs: true
  }
}

/**
 * Fetches a shop's config.json from the network.
 *
 * @param {string} dataURL: The shop's data URL
 * @param {number} netId: Ethereum network Id (1=Mainnet, 4=Rinkeby, 999=Test, etc..).
 * @returns {Promise<{object}>}
 */
async function getShopConfigJson(dataURL, netId) {
  const url = `${dataURL}config.json`
  try {
    const res = await fetch(url)
    const data = await res.json()
    const defaultData = Defaults[netId] || {}
    const networkData = data ? data.networks[netId] : {}
    return {
      ...data,
      ...defaultData,
      ...networkData
    }
  } catch (e) {
    log.error(`Error fetching config.json from ${url}`)
    return null
  }
}

module.exports = {
  defaults: Defaults,
  getShopConfigJson
}
