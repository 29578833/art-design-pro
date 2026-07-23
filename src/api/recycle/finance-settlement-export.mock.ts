import { SEED_SETTLEMENT_VEHICLE_EXPORT } from '@/mock/recycle/finance-settlement.mock'
import { SETTLEMENT_EXPORT_COLUMNS } from '@/types/recycle/finance-settlement-export'
import type {
  SettlementVehicleExportRow,
  SettlementVehicleExportSearchParams
} from '@/types/recycle/finance-settlement-export'

function delay(ms = 180) {
  return new Promise((r) => setTimeout(r, ms))
}

let exportStore: SettlementVehicleExportRow[] = structuredClone(SEED_SETTLEMENT_VEHICLE_EXPORT)

function resolvePage(params: { page?: number; limit?: number; current?: number; size?: number }) {
  const page = Number(params.page ?? params.current ?? 1)
  const limit = Number(params.limit ?? params.size ?? 20)
  return { page: Math.max(1, page), limit: Math.max(1, limit) }
}

function filterRows(params: SettlementVehicleExportSearchParams) {
  const plate = params.plate?.trim() || ''
  const selfNo = params.self_no?.trim() || ''
  const salesman = params.salesman?.trim() || ''
  const status = params.settle_status
  const start = params.date_start || ''
  const end = params.date_end || ''

  return exportStore.filter((r) => {
    const plateOk = !plate || r.plate.includes(plate)
    const selfOk = !selfNo || r.self_no.includes(selfNo)
    const salesOk = !salesman || r.salesman.includes(salesman)
    const statusOk = !status || r.settle_status === status
    const inbound = r.inbound_date
    const dateOk =
      (!start || inbound === '—' || inbound >= start) && (!end || inbound === '—' || inbound <= end)
    return plateOk && selfOk && salesOk && statusOk && dateOk
  })
}

export async function fetchSettlementVehicleExportList(
  params: SettlementVehicleExportSearchParams
) {
  await delay()
  const { page, limit } = resolvePage(params)
  const filtered = filterRows(params)
  const start = (page - 1) * limit
  return {
    records: filtered.slice(start, start + limit),
    total: filtered.length,
    current: page,
    size: limit
  }
}

export async function fetchSettlementVehicleExportAll(params: SettlementVehicleExportSearchParams) {
  await delay()
  return filterRows(params)
}

export function fetchSettlementVehicleExportColumns() {
  return SETTLEMENT_EXPORT_COLUMNS
}

export function resetSettlementVehicleExportMockStore() {
  exportStore = structuredClone(SEED_SETTLEMENT_VEHICLE_EXPORT)
}
