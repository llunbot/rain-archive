// @ts-check
/**
 * @typedef {50 | 240 | 480} AreaSizeInKm
 */
import DateFnsTz from 'date-fns-tz'
import fetch from 'node-fetch'
import fs from 'fs'
import { URL } from 'url'
import { Octokit } from '@octokit/rest'
import { runCommand } from './repository.js'

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
 *
 * Get weather.gov.sg url from timestamp
 *
 * @param {number} timestamp
 * @param {AreaSizeInKm} areaSizeInKm
 * @returns {string | null}
 */
export function getRainAreaUrlFromTimestamp(timestamp, areaSizeInKm) {
  switch (areaSizeInKm) {
    case 50:
      return `http://www.weather.gov.sg/files/rainarea/50km/v2/dpsri_70km_${getFileNameTime(
        timestamp,
        5
      )}dBR.dpsri.png`
    case 240:
      return `http://www.weather.gov.sg/files/rainarea/240km/dpsri_240km_${getFileNameTime(
        timestamp,
        15
      )}dBR.dpsri.png`
    case 480:
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
 * @returns {Promise<string | null>}
 */
export async function fetchRainAreaImage(timestamp, areaSizeInKm) {
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
  fs.writeFileSync(fileName, data)
  return fileName
}

/**
 * Return sets of past two hours timestamps for each map area size
 *
 * @returns {{
 *  [key in AreaSizeInKm]: number[]
 * }}
 */
export function pastTwoHoursTimestamps() {
  const tenMinutesAgo = Date.now() - 600_000

  return {
    50: Array.from({ length: 25 }, (_, key) => tenMinutesAgo - 300_000 * key),
    240: Array.from({ length: 9 }, (_, key) => tenMinutesAgo - 900_000 * key),
    480: Array.from({ length: 5 }, (_, key) => tenMinutesAgo - 1_800_000 * key),
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

  const workspace = (process.env['GITHUB_WORKSPACE'] || '').split('/') ?? []
  const root = workspace.slice(0, workspace.length - 1).join('/')
  console.log(root)
  runCommand(['ls', root])

  const octokit = new Octokit({
    auth: process.env['GITHUB_TOKEN'],
  })
  const [owner, repo] = (process.env['GITHUB_REPOSITORY'] || '').split('/')
  const response = await octokit.repos.listBranches({
    owner,
    repo,
  })
  console.log(response)
}
