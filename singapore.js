// @ts-check
/**
 * @typedef {'sg50km' | 'sg240km' | 'sg480km'} AreaSizeInKm
 */
import DateFnsTz from 'date-fns-tz'
import fetch from 'node-fetch'
import fs from 'fs'
import path from 'path'
import { URL } from 'url'
import {
  getDataPath,
  loadContentBranch,
  makeSureDirectoryExist,
  pushContentBranch,
  sleep,
} from './repository.js'

const { format, utcToZonedTime } = DateFnsTz

/**
 *
 * Get weather.gov.sg file time format from timestamp
 *
 * @param {number} timestamp
 * @param {number} minutesFloor
 * @returns {string}
 */
export function getFileNameTime(timestamp, minutesFloor) {
  const timeZone = 'Asia/Singapore'
  const subtractFloor = timestamp % (minutesFloor * 60 * 1000)
  const date = new Date(timestamp - subtractFloor)
  const zonedDate = utcToZonedTime(date, timeZone)
  return format(zonedDate, 'yyyyMMddkkmmssSS', { timeZone })
}

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
 * Get weather.gov.sg url from timestamp
 *
 * @param {number} timestamp
 * @param {AreaSizeInKm} areaSizeInKm
 * @returns {string | null}
 */
export function getRainAreaUrlFromTimestamp(timestamp, areaSizeInKm) {
  switch (areaSizeInKm) {
    case 'sg50km':
      return `http://www.weather.gov.sg/files/rainarea/50km/v2/dpsri_70km_${getFileNameTime(
        timestamp,
        5
      )}dBR.dpsri.png`
    case 'sg240km':
      return `http://www.weather.gov.sg/files/rainarea/240km/dpsri_240km_${getFileNameTime(
        timestamp,
        15
      )}dBR.dpsri.png`
    case 'sg480km':
      return `http://www.weather.gov.sg/files/rainarea/480km/dpsri_480km_${getFileNameTime(
        timestamp,
        30
      )}dBR.dpsri.png`
    default:
      return null
  }
}

/**
 *
 * @param {number} timestamp
 * @param {AreaSizeInKm} areaSizeInKm
 * @param {string} [root]
 * @returns {Promise<string | null>}
 */
export async function fetchRainAreaImage(timestamp, areaSizeInKm, root) {
  const stringUrl = getRainAreaUrlFromTimestamp(timestamp, areaSizeInKm)
  if (!stringUrl) return null
  const response = await fetch(stringUrl)
  if (response.status !== 200) {
    return null
  }
  const data = await response.buffer()
  const imageUrl = new URL(stringUrl)
  const fileName = imageUrl.pathname.split('/').pop()
  if (!fileName) return null
  const filePath = path.join(root ?? '', fileName)
  console.log(filePath)
  fs.writeFileSync(filePath, data)
  return filePath
}

/**
 * Return sets of past two hours timestamps for each map area size
 *
 * @param {number} timestamp
 * @returns {{
 *  [key in AreaSizeInKm]: number[]
 * }}
 */
export function pastTwoHoursTimestamps(timestamp) {
  const tenMinutesAgo = timestamp - 600_000

  return {
    sg50km: Array.from(
      { length: 25 },
      (_, key) => tenMinutesAgo - 300_000 * key
    ),
    sg240km: Array.from(
      { length: 9 },
      (_, key) => tenMinutesAgo - 900_000 * key
    ),
    sg480km: Array.from(
      { length: 5 },
      (_, key) => tenMinutesAgo - 1_800_000 * key
    ),
  }
}

/**
 *
 * Start fetch rain area images with timestamp
 *
 * @param {number} timestamp
 */
export async function fetcher(timestamp) {
  console.log('Load singapore rain areas in past 2 hours')
  await loadContentBranch()
  const { sg50km, sg240km, sg480km } = pastTwoHoursTimestamps(timestamp)
  // Load all 480km area images
  for (const time of sg480km) {
    await fetchRainAreaImage(
      time,
      'sg480km',
      makeSureDirectoryExist(
        path.join(
          getDataPath(),
          'singapore',
          ...getTimestampDatePath(timestamp),
          '480'
        )
      )
    )
    await sleep(1000)
  }

  // Load all 240km area images
  for (const time of sg240km) {
    await fetchRainAreaImage(
      time,
      'sg240km',
      makeSureDirectoryExist(
        path.join(
          getDataPath(),
          'singapore',
          ...getTimestampDatePath(timestamp),
          '240'
        )
      )
    )
    await sleep(1000)
  }

  // Load all 50km area images
  for (const time of sg50km) {
    await fetchRainAreaImage(
      time,
      'sg50km',
      makeSureDirectoryExist(
        path.join(
          getDataPath(),
          'singapore',
          ...getTimestampDatePath(timestamp),
          '50'
        )
      )
    )
    await sleep(1000)
  }
  await pushContentBranch()
}
