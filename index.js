// @ts-check
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import { fetcher as singaporeFetcher } from './singapore.js'
import { fetcher as malaysiaFetcher } from './malaysia.js'

const fetchers = {
  singapore: singaporeFetcher,
  malaysia: malaysiaFetcher,
}

const argv = yargs(hideBin(process.argv))
  .option('region', {
    alias: 'r',
    type: 'string',
    description: 'map region name',
    demandOption: true,
    default: 'singapore',
    choices: ['singapore', 'malaysia'],
  })
  .parseSync()

async function run() {
  const fetcher = fetchers[argv.region]
  if (!fetcher) {
    throw new Error('Unsupported region')
  }

  const currentTime = Date.now()
  await fetcher(currentTime)
}

run()
  .then(() => {
    console.log('Done')
  })
  .catch((error) => {
    console.error(error.message)
    console.error(error.stack)
  })
