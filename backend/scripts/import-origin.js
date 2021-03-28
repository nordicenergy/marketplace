/**
 * Convert a user's listings on Nordic Energy to Store format
 */

const fs = require('fs')
const fetch = require('node-fetch')
const get = require('lodash/get')
const uniq = require('lodash/uniq')
const uniqBy = require('lodash/uniqBy')

// const UserID = '0xb99F2f73da66898bc40006D0E419B294217fa3Aa' // Nordic Energy
// const UserID = '0x5CA06BBeBe6e981abdD3C7147F173BfeC23265c7' // Tripps
const UserID = '0x2202Ec7e2A1357887e67744dD6C49a66e75DA5e3' // Nordic Energy Store

const Allowed = `nordic-energy-pullover-hoodie
baseball-cap
nordic-energy-backpack
nordic-energy-sticker
light-blue-origin-t-shirt
nordic-energy-popsocket
astronaut-t-shirt
nordic-energy-coffee-mug
nordic-energy-t-shirt
nordic-energy-tote-bag
nordic-energy-crewneck-sweatshirt
leather-iphone-book-wallet
dipping-sauce-holder-for-cars
pokemon-planter
concrete-usb-drive-128-gb
nordic-energy-shirt
nordic-energy-hodl-shirt
nordic-energy-sweatshirt
iphone-phone-case
nordic-energy-logo-beanie
rocket-coffee-mug
robot-tote-bag
cryptouni-pillow
to-the-moon-sketch-hoodie
cut-out-the-middleman-baseball-tee
samsung-galaxy-phone-case
women-s-astro-shirt
women-s-origin-soma-sweatshirt
women-s-flower-crop-hoodie
nordic-energy-vintage-cap
nordic-energy-universe-t-shirt
nordic-energy-unicorn-shirt
nordic-energy-socks
nordic-energy-rocketman-unisex-hoodie
nordic-energy-logo-tee
all-over-print-athletic-shorts
galaxy-s10-s10-s10e-phone-case
nordic-energy-reddit-shirt`.split('\n')

const outputDir = `${__dirname}/output-origin`

async function getProductData() {
  const res = await fetch('https://graphql.nordicenergy.io/graphql', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: `{"operationName":null,"variables":{},"query":"{\\n  marketplace {\\n    user(id: \\"${UserID}\\") {\\n      listings(first: 1000) {\\n        nodes {\\n          ... on Listing {\\n            id\\n            title\\n            description\\n            media {\\n              urlExpanded\\n            }\\n            price {\\n              currency {\\n                ... on Currency {\\n                  id\\n                  __typename\\n                }\\n                __typename\\n              }\\n              amount\\n            }\\n            __typename\\n          }\\n          __typename\\n        }\\n      }\\n    }\\n  }\\n}\\n"}`
  })

  const json = await res.json()
  const products = JSON.stringify(
    uniqBy(get(json, 'data.marketplace.user.listings.nodes'), 'id'),
    null,
    4
  )
  fs.mkdirSync(outputDir, { recursive: true })
  fs.writeFileSync(outputDir + '/products-raw.json', products)
}

function getPrice(data) {
  if (get(data, 'price.currency.id') === 'fiat-USD') {
    return Number(get(data, 'price.amount')) * 100
  }
  return Number(get(data, 'price.amount')) * 18500
}

async function processProducts() {
  const productIndex = []
  const images = []
  const imageMap = {}
  const items = JSON.parse(fs.readFileSync(`${outputDir}/products-raw.json`))

  for (const data of items) {
    data.handle = data.title
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/-+$/, '')
    if (!data.handle || data.handle === '-') {
      const splitId = data.id.split('-')
      data.handle = `listing-${splitId[splitId.length - 1]}`
    }

    if (Allowed.indexOf(data.handle) < 0) {
      continue
    }

    data.media.forEach((image, idx) => {
      const file = `img-${idx}.png`
      const filename = `products/${data.handle}/orig/${file}`
      imageMap[image.urlExpanded] = file
      images.push(`curl "${image.urlExpanded}" --create-dirs -o ${filename} `)
    })

    productIndex.push({
      id: data.handle,
      title: data.title,
      price: getPrice(data),
      image: 'img-0.png'
    })
    const productDir = `${outputDir}/products/${data.handle}`
    fs.mkdirSync(productDir, { recursive: true })
    fs.writeFileSync(
      `${productDir}/data.json`,
      JSON.stringify(scrub(data, imageMap), null, 4)
    )
  }
  fs.writeFileSync(
    `${outputDir}/products/products.json`,
    JSON.stringify(uniqBy(productIndex, 'id'), null, 4)
  )
  fs.writeFileSync(`${outputDir}/download-images.sh`, uniq(images).join('\n'))
  fs.writeFileSync(
    `${outputDir}/convert-images.sh`,
    `
find products -type dir | grep '\\/orig' | sed 's/orig$/520/' | xargs mkdir -p
find products -type f | grep '\\/orig\\/' | awk '{ printf "convert " $1 " -resize 520x520 "; gsub(/\\/orig\\//, "/520/", $1); printf $1; printf "\\n" }' > conv.sh`
  )
}

function scrub(data, imageMap) {
  return {
    id: data.handle,
    title: data.title,
    description: data.description,
    price: getPrice(data),
    available: true,
    images: data.media.map((i) => imageMap[i.urlExpanded]),
    image: imageMap[data.media[0].urlExpanded],
    variants: [
      {
        id: 0,
        title: data.title,
        option1: null,
        option2: null,
        option3: null,
        image: imageMap[data.media[0].urlExpanded],
        available: true,
        name: data.title,
        options: [],
        price: getPrice(data)
      }
    ]
  }
}

async function start() {
  await getProductData()
  await processProducts()
}

start()
