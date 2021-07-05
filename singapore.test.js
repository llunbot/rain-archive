// @ts-check
import test from 'ava'
import { getFileNameTime, getRainAreaUrlFromTimestamp } from './singapore.js'
// http://www.weather.gov.sg/files/rainarea/50km/v2/dpsri_70km_2021070409500000dBR.dpsri.png
// http://www.weather.gov.sg/files/rainarea/50km/v2/dpsri_70km_2021070409550000dBR.dpsri.png
// http://www.weather.gov.sg/files/rainarea/50km/v2/dpsri_70km_2021070409250000dBR.dpsri.png

test('#getFileNameTime return date from timestamp in Singapore timezone', (t) => {
  t.is(getFileNameTime(1625369575346, 5), '2021070411300000')
  t.is(getFileNameTime(1625383277705, 5), '2021070415200000')

  t.is(getFileNameTime(1625369575346, 15), '2021070411300000')
  t.is(getFileNameTime(1625383277705, 15), '2021070415150000')

  t.is(getFileNameTime(1625369575346, 30), '2021070411300000')
  t.is(getFileNameTime(1625383277705, 30), '2021070415000000')
})

test('#getRainAreaUrlFromTimestamp', (t) => {
  t.is(
    getRainAreaUrlFromTimestamp(1625369575346, 50),
    'http://www.weather.gov.sg/files/rainarea/50km/v2/dpsri_70km_2021070411300000dBR.dpsri.png'
  )
  t.is(
    getRainAreaUrlFromTimestamp(1625383277705, 50),
    'http://www.weather.gov.sg/files/rainarea/50km/v2/dpsri_70km_2021070415200000dBR.dpsri.png'
  )

  t.is(
    getRainAreaUrlFromTimestamp(1625369575346, 240),
    'http://www.weather.gov.sg/files/rainarea/240km/dpsri_240km_2021070411300000dBR.dpsri.png'
  )
  t.is(
    getRainAreaUrlFromTimestamp(1625383277705, 240),
    'http://www.weather.gov.sg/files/rainarea/240km/dpsri_240km_2021070415150000dBR.dpsri.png'
  )

  t.is(
    getRainAreaUrlFromTimestamp(1625369575346, 480),
    'http://www.weather.gov.sg/files/rainarea/480km/dpsri_480km_2021070411300000dBR.dpsri.png'
  )
  t.is(
    getRainAreaUrlFromTimestamp(1625383277705, 480),
    'http://www.weather.gov.sg/files/rainarea/480km/dpsri_480km_2021070415000000dBR.dpsri.png'
  )
})
