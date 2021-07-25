// @ts-check
import DateFnsTz from 'date-fns-tz'
import fetch from 'node-fetch'
import fs from 'fs'
import path from 'path'
import {
  getDataPath,
  loadContentBranch,
  makeSureDirectoryExist,
  pushContentBranch,
} from './repository.js'

const { format, utcToZonedTime } = DateFnsTz

/**
 * Get path for input timestamp date images
 *
 * @param {number} timestamp
 * @returns {string[]}
 */
export function getTimestampDatePath(timestamp) {
  const timeZone = 'Asia/Singapore'
  const date = new Date(timestamp)
  const zonedDate = utcToZonedTime(date, timeZone)
  return [
    format(zonedDate, 'yyyy', { timeZone }),
    format(zonedDate, 'MM', { timeZone }),
    format(zonedDate, 'dd', { timeZone }),
  ]
}

/**
 *
 * @param {number} timestamp
 * @param {string} [root]
 * @returns {Promise<string | null>}
 */
export async function fetchRainAreaImage(timestamp, root) {
  await loadContentBranch()

  const response = await fetch(
    'https://api.met.gov.my/static/images/swirl-latest.gif'
  )
  if (response.status !== 200) {
    return null
  }

  const data = await response.buffer()
  const filePath = path.join(root ?? '', `${timestamp}.gif`)
  console.log(filePath)
  fs.writeFileSync(filePath, data)
  return filePath
}

/**
 *
 * Start fetch rain area images with timestamp
 *
 * @param {number} timestamp
 */
export async function fetcher(timestamp) {
  console.log('Load Malaysia rain areas')
  await loadContentBranch()
  await fetchRainAreaImage(
    timestamp,
    makeSureDirectoryExist(
      path.join(getDataPath(), 'malaysia', ...getTimestampDatePath(timestamp))
    )
  )
  await pushContentBranch()
}
