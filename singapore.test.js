// @ts-check
import test from 'ava'
import fs from 'fs'
import {
  getFileNameTime,
  getRainAreaUrlFromTimestamp,
  fetchRainAreaImage,
  pastTwoHoursTimestamps,
} from './singapore.js'

test('#getFileNameTime return date from timestamp in Singapore timezone', (t) => {
  t.is(getFileNameTime(1625369575346, 5), '2021070411300000')
  t.is(getFileNameTime(1625383277705, 5), '2021070415200000')

  t.is(getFileNameTime(1625369575346, 15), '2021070411300000')
  t.is(getFileNameTime(1625383277705, 15), '2021070415150000')

  t.is(getFileNameTime(1625369575346, 30), '2021070411300000')
  t.is(getFileNameTime(1625383277705, 30), '2021070415000000')
})

test('#getRainAreaUrlFromTimestamp returns rain area image url for specific timestamp', (t) => {
  t.is(
    getRainAreaUrlFromTimestamp(1625369575346, 'sg50km'),
    'http://www.weather.gov.sg/files/rainarea/50km/v2/dpsri_70km_2021070411300000dBR.dpsri.png'
  )
  t.is(
    getRainAreaUrlFromTimestamp(1625383277705, 'sg50km'),
    'http://www.weather.gov.sg/files/rainarea/50km/v2/dpsri_70km_2021070415200000dBR.dpsri.png'
  )

  t.is(
    getRainAreaUrlFromTimestamp(1625369575346, 'sg240km'),
    'http://www.weather.gov.sg/files/rainarea/240km/dpsri_240km_2021070411300000dBR.dpsri.png'
  )
  t.is(
    getRainAreaUrlFromTimestamp(1625383277705, 'sg240km'),
    'http://www.weather.gov.sg/files/rainarea/240km/dpsri_240km_2021070415150000dBR.dpsri.png'
  )

  t.is(
    getRainAreaUrlFromTimestamp(1625369575346, 'sg480km'),
    'http://www.weather.gov.sg/files/rainarea/480km/dpsri_480km_2021070411300000dBR.dpsri.png'
  )
  t.is(
    getRainAreaUrlFromTimestamp(1625383277705, 'sg480km'),
    'http://www.weather.gov.sg/files/rainarea/480km/dpsri_480km_2021070415000000dBR.dpsri.png'
  )
})

test('#fetchRainAreaImage downloads image from weather.gov.sg and save into the disk', async (t) => {
  // Timestamp at 10 minutes before, making sure the image is exists
  const timestamp = Date.now() - 600_000
  const imagePath = await fetchRainAreaImage(timestamp, 'sg50km')
  if (!imagePath) {
    t.fail('Image path must not be null')
    return
  }
  t.is(imagePath, `dpsri_70km_${getFileNameTime(timestamp, 5)}dBR.dpsri.png`)
  t.notThrows(() => {
    fs.statSync(imagePath)
  }, 'Image file should exist')
  fs.unlinkSync(imagePath)
})

test('#pastTwoHoursTimestamps returns set of timestamps in the past two hours for downloading images', (t) => {
  const now = Date.now()
  // Timestamp at 10 minutes before, making sure the image is exists
  const pastTenMinutes = now - 600000
  const timestamps = pastTwoHoursTimestamps(now)
  t.deepEqual(
    {
      sg50km: [
        pastTenMinutes,
        pastTenMinutes - 300_000,
        pastTenMinutes - 600_000,
        pastTenMinutes - 900_000,
        pastTenMinutes - 1_200_000,
        pastTenMinutes - 1_500_000,
        pastTenMinutes - 1_800_000,
        pastTenMinutes - 2_100_000,
        pastTenMinutes - 2_400_000,
        pastTenMinutes - 2_700_000,
        pastTenMinutes - 3_000_000,
        pastTenMinutes - 3_300_000,
        pastTenMinutes - 3_600_000,
        pastTenMinutes - 3_900_000,
        pastTenMinutes - 4_200_000,
        pastTenMinutes - 4_500_000,
        pastTenMinutes - 4_800_000,
        pastTenMinutes - 5_100_000,
        pastTenMinutes - 5_400_000,
        pastTenMinutes - 5_700_000,
        pastTenMinutes - 6_000_000,
        pastTenMinutes - 6_300_000,
        pastTenMinutes - 6_600_000,
        pastTenMinutes - 6_900_000,
        pastTenMinutes - 7_200_000,
      ],
      sg240km: [
        pastTenMinutes,
        pastTenMinutes - 900_000,
        pastTenMinutes - 1_800_000,
        pastTenMinutes - 2_700_000,
        pastTenMinutes - 3_600_000,
        pastTenMinutes - 4_500_000,
        pastTenMinutes - 5_400_000,
        pastTenMinutes - 6_300_000,
        pastTenMinutes - 7_200_000,
      ],
      sg480km: [
        pastTenMinutes,
        pastTenMinutes - 1_800_000,
        pastTenMinutes - 3_600_000,
        pastTenMinutes - 5_400_000,
        pastTenMinutes - 7_200_000,
      ],
    },
    timestamps
  )
})
