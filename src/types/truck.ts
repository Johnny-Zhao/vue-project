export interface TruckListQuery {
  truckType: '' | number
  tractorLicensePlateNo: string
  trailerLicensePlateNo: string
  pageIndex: number
  pageSize: number
  isDriverLicenseExpire: boolean
  isVehicleLicenseExpire: boolean
  isBusinessExpire: boolean
  isCompulsoryExpire: boolean
}

export interface TruckItem {
  id: number
  truckType: number | null
  tractorLicensePlateNo: string | null
  truckModel: string | null
  trailerLicensePlateNo: string | null
  whiteTruckFlag: number | null
  whiteTruckNo: string | null
  wharfPIN: string | null
  createTime: string | null
  modifyPersonName: string | null
  modifyTime: string | null
  dispatchTractorId: number | null
  dispatchTrailerId: number | null
  dispatchName: string | null
  powerType: number | null
  consumption: number | null
}

export interface TruckListPageData {
  pageIndex: number
  pageSize: number
  total: number
  list: TruckItem[]
}

export interface TruckListResponse {
  code: number
  msg: string
  count: number
  data: TruckListPageData
  succeed: boolean
}
