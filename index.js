// @ts-check
import { setup } from './repository'

async function run() {
  await setup()
}

run()
  .then(() => {
    console.log('Done')
  })
  .catch((error) => {
    console.error(error.message)
    console.error(error.stack)
  })
