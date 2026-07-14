/** 车辆档案 OCR 回填工具（对齐 admin VehicleArchiveEdit + 后端 recognize_* 接口） */

export type ArchiveOwnerForm = {
  syr: string
  sfzmhm: string
  dz: string
  sfzmmc: string
  hpzl: string
}

export type ArchiveVehicleForm = {
  clsbdh: string
  hphm: string
  hpzl: string
  cllx: string
  syxz: string
  ccdjrq: string
  rlzl: string
  fdjh: string
  fdjxh: string
  xszbh: string
  czbh: string
  clpp1: string
  clxh: string
  ppxh: string
  cwkc: string
  cwkk: string
  cwkg: string
  gl: string
  pl: string
  hdzk: string
  zbzl: string
  zzl: string
  csys: string
}

export type ArchiveAgentForm = {
  jbr: string
  jbrsfzmhm: string
}

function pickNum(v: unknown) {
  if (v === null || v === undefined || v === '') return ''
  const m = String(v).match(/(\d+(?:\.\d+)?)/)
  return m ? m[1] : String(v)
}

function pickDims(text: unknown) {
  const raw = String(text || '')
  const m = raw.match(/(\d+(?:\.\d+)?)[×xX*](\d+(?:\.\d+)?)[×xX*](\d+(?:\.\d+)?)/)
  if (!m) return { cwkc: '', cwkk: '', cwkg: '' }
  return { cwkc: m[1], cwkk: m[2], cwkg: m[3] }
}

/** 行驶证 OCR 全部字段回填 */
export function applyDrivingOcrResult(
  d: Record<string, unknown>,
  vehicleForm: ArchiveVehicleForm,
  ownerForm?: ArchiveOwnerForm
) {
  if (d.plate_no) vehicleForm.hphm = String(d.plate_no)
  if (d.vin) vehicleForm.clsbdh = String(d.vin)
  if (d.engine_no) vehicleForm.fdjh = String(d.engine_no)
  if (d.reg_date) vehicleForm.ccdjrq = String(d.reg_date)
  if (d.register_no) vehicleForm.xszbh = String(d.register_no)
  if (d.file_no && !vehicleForm.xszbh) vehicleForm.xszbh = String(d.file_no)
  if (d.brand) vehicleForm.clpp1 = String(d.brand)
  if (d.model) vehicleForm.clxh = String(d.model)
  if (d.brand || d.model) {
    vehicleForm.ppxh = [d.brand, d.model].filter(Boolean).join('')
  }
  if (d.vehicle_type) vehicleForm.cllx = String(d.vehicle_type)
  if (d.use_character) vehicleForm.syxz = String(d.use_character)
  if (d.inspection_record && !vehicleForm.rlzl) {
    vehicleForm.rlzl = String(d.inspection_record)
  }

  const dims = pickDims(d.overall_dimensions)
  if (dims.cwkc) vehicleForm.cwkc = dims.cwkc
  if (dims.cwkk) vehicleForm.cwkk = dims.cwkk
  if (dims.cwkg) vehicleForm.cwkg = dims.cwkg

  if (d.approved_passengers) vehicleForm.hdzk = pickNum(d.approved_passengers)
  if (d.total_mass) vehicleForm.zzl = pickNum(d.total_mass)
  if (d.curb_weight) vehicleForm.zbzl = pickNum(d.curb_weight)

  if (ownerForm && d.owner_name) ownerForm.syr = String(d.owner_name)
  if (ownerForm && d.address) ownerForm.dz = String(d.address)
}

/** 产证一二页 OCR 回填 */
export function applyRegCertOcrResult(d: Record<string, unknown>, vehicleForm: ArchiveVehicleForm) {
  if (d.certificate_no) vehicleForm.czbh = String(d.certificate_no)
  if (d.register_no) vehicleForm.hphm = String(d.register_no)
  if (d.plate_no && !vehicleForm.hphm) vehicleForm.hphm = String(d.plate_no)
  if (d.register_date) vehicleForm.ccdjrq = String(d.register_date)
  if (d.vin) vehicleForm.clsbdh = String(d.vin)
  if (d.engine_no) vehicleForm.fdjh = String(d.engine_no)
  if (d.engine_model) vehicleForm.fdjxh = String(d.engine_model)
  if (d.brand) {
    vehicleForm.clpp1 = String(d.brand)
    vehicleForm.ppxh = String(d.brand)
  }
  if (d.vehicle_type) vehicleForm.cllx = String(d.vehicle_type)
  if (d.body_color) vehicleForm.csys = String(d.body_color)
  if (d.fuel_type) vehicleForm.rlzl = String(d.fuel_type)
  if (d.displacement) vehicleForm.pl = pickNum(d.displacement)
  if (d.power) vehicleForm.gl = pickNum(d.power)
  if (d.overall_length) vehicleForm.cwkc = pickNum(d.overall_length)
  if (d.overall_width) vehicleForm.cwkk = pickNum(d.overall_width)
  if (d.overall_height) vehicleForm.cwkg = pickNum(d.overall_height)
  if (d.total_mass) vehicleForm.zzl = pickNum(d.total_mass)
  if (d.approved_passengers) vehicleForm.hdzk = pickNum(d.approved_passengers)
}

/** 营业执照 OCR 回填 */
export function applyLicenseOcrResult(d: Record<string, unknown>, ownerForm: ArchiveOwnerForm) {
  if (d.company_name) ownerForm.syr = String(d.company_name)
  if (d.credit_code) ownerForm.sfzmhm = String(d.credit_code)
  if (d.address) ownerForm.dz = String(d.address)
}

/** 身份证正面 OCR 回填 */
export function applyIdCardFrontResult(
  d: Record<string, unknown>,
  target: ArchiveOwnerForm | ArchiveAgentForm,
  isOwner = true
) {
  if (d.name) {
    if (isOwner) (target as ArchiveOwnerForm).syr = String(d.name)
    else (target as ArchiveAgentForm).jbr = String(d.name)
  }
  if (d.id_number) {
    if (isOwner) (target as ArchiveOwnerForm).sfzmhm = String(d.id_number)
    else (target as ArchiveAgentForm).jbrsfzmhm = String(d.id_number)
  }
  if (isOwner && d.address) (target as ArchiveOwnerForm).dz = String(d.address)
}
