import { requestData } from '@/api/request'
import type { TruckListPageData, TruckListQuery } from '@/types/truck'

const TRUCK_API_BASE_URL = import.meta.env.VITE_TRUCK_API_BASE_URL ?? '/smart-ebao-api'

export async function fetchTruckListApi(payload: TruckListQuery) {
  return requestData<TruckListPageData, TruckListQuery>({
    url: '/oitTrade/dispatchVehicle/truckList',
    method: 'POST',
    data: payload,
    baseURL: TRUCK_API_BASE_URL,
  })
}
