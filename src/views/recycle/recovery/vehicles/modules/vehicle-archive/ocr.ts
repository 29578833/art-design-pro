import type { ArchiveAgentForm, ArchiveOwnerForm, ArchiveVehicleForm } from './types'

function pickNum(value: unknown) {
  if (value === null || value === undefined || value === '') return ''
  const match = String(value).match(/(\d+(?:\.\d+)?)/)
  return match ? match[1] : String(value)
}

function pickDims(value: unknown) {
  const raw = String(value || '')
  const match = raw.match(/(\d+(?:\.\d+)?)[×xX*](\d+(?:\.\d+)?)[×xX*](\d+(?:\.\d+)?)/)
  if (!match) return { cwkc: '', cwkk: '', cwkg: '' }
  return { cwkc: match[1], cwkk: match[2], cwkg: match[3] }
}

/** 将行驶证 OCR 结果回填到车辆和所有人表单。 */
export function applyDrivingOcrResult(
  data: Record<string, unknown>,
  vehicleForm: ArchiveVehicleForm,
  ownerForm?: ArchiveOwnerForm
) {
  if (data.plate_no) vehicleForm.hphm = String(data.plate_no)
  if (data.vin) vehicleForm.clsbdh = String(data.vin)
  if (data.engine_no) vehicleForm.fdjh = String(data.engine_no)
  if (data.reg_date) vehicleForm.ccdjrq = String(data.reg_date)
  if (data.register_no) vehicleForm.xszbh = String(data.register_no)
  if (data.file_no && !vehicleForm.xszbh) vehicleForm.xszbh = String(data.file_no)
  if (data.brand) vehicleForm.clpp1 = String(data.brand)
  if (data.model) vehicleForm.clxh = String(data.model)
  if (data.brand || data.model) {
    vehicleForm.ppxh = [data.brand, data.model].filter(Boolean).join('')
  }
  if (data.vehicle_type) vehicleForm.cllx = String(data.vehicle_type)
  if (data.use_character) vehicleForm.syxz = String(data.use_character)
  if (data.inspection_record && !vehicleForm.rlzl) {
    vehicleForm.rlzl = String(data.inspection_record)
  }

  const dimensions = pickDims(data.overall_dimensions)
  if (dimensions.cwkc) vehicleForm.cwkc = dimensions.cwkc
  if (dimensions.cwkk) vehicleForm.cwkk = dimensions.cwkk
  if (dimensions.cwkg) vehicleForm.cwkg = dimensions.cwkg

  if (data.approved_passengers) vehicleForm.hdzk = pickNum(data.approved_passengers)
  if (data.total_mass) vehicleForm.zzl = pickNum(data.total_mass)
  if (data.curb_weight) vehicleForm.zbzl = pickNum(data.curb_weight)

  if (ownerForm && data.owner_name) ownerForm.syr = String(data.owner_name)
  if (ownerForm && data.address) ownerForm.dz = String(data.address)
}

/** 将机动车登记证书 OCR 结果回填到车辆表单。 */
export function applyRegCertOcrResult(
  data: Record<string, unknown>,
  vehicleForm: ArchiveVehicleForm
) {
  if (data.certificate_no) vehicleForm.czbh = String(data.certificate_no)
  if (data.register_no) vehicleForm.hphm = String(data.register_no)
  if (data.plate_no && !vehicleForm.hphm) vehicleForm.hphm = String(data.plate_no)
  if (data.register_date) vehicleForm.ccdjrq = String(data.register_date)
  if (data.vin) vehicleForm.clsbdh = String(data.vin)
  if (data.engine_no) vehicleForm.fdjh = String(data.engine_no)
  if (data.engine_model) vehicleForm.fdjxh = String(data.engine_model)
  if (data.brand) {
    vehicleForm.clpp1 = String(data.brand)
    vehicleForm.ppxh = String(data.brand)
  }
  if (data.vehicle_type) vehicleForm.cllx = String(data.vehicle_type)
  if (data.body_color) vehicleForm.csys = String(data.body_color)
  if (data.fuel_type) vehicleForm.rlzl = String(data.fuel_type)
  if (data.displacement) vehicleForm.pl = pickNum(data.displacement)
  if (data.power) vehicleForm.gl = pickNum(data.power)
  if (data.overall_length) vehicleForm.cwkc = pickNum(data.overall_length)
  if (data.overall_width) vehicleForm.cwkk = pickNum(data.overall_width)
  if (data.overall_height) vehicleForm.cwkg = pickNum(data.overall_height)
  if (data.total_mass) vehicleForm.zzl = pickNum(data.total_mass)
  if (data.approved_passengers) vehicleForm.hdzk = pickNum(data.approved_passengers)
}

/** 将营业执照 OCR 结果回填到所有人表单。 */
export function applyLicenseOcrResult(data: Record<string, unknown>, ownerForm: ArchiveOwnerForm) {
  if (data.company_name) ownerForm.syr = String(data.company_name)
  if (data.credit_code) ownerForm.sfzmhm = String(data.credit_code)
  if (data.address) ownerForm.dz = String(data.address)
}

/** 将身份证正面 OCR 结果回填到所有人或代理人表单。 */
export function applyIdCardFrontResult(
  data: Record<string, unknown>,
  target: ArchiveOwnerForm | ArchiveAgentForm,
  isOwner = true
) {
  if (data.name) {
    if (isOwner) (target as ArchiveOwnerForm).syr = String(data.name)
    else (target as ArchiveAgentForm).jbr = String(data.name)
  }
  if (data.id_number) {
    if (isOwner) (target as ArchiveOwnerForm).sfzmhm = String(data.id_number)
    else (target as ArchiveAgentForm).jbrsfzmhm = String(data.id_number)
  }
  if (isOwner && data.address) (target as ArchiveOwnerForm).dz = String(data.address)
}
