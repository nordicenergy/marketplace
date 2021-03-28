# Nordic Energy IPFS

Convenience methods for getting and setting data in IPFS

## Usage

```
import { get, post } from '@nordic-energy/ipfs'

const ipfsHash = await post("https://ipfs.nordicenergy.io", { my: "data" })
console.log(ipfsHash)

const retrieved = await get("https://ipfs.nordicenergy.io", ipfsHash)
console.log(retrieved)

```
