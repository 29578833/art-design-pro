/** 行驶证 OCR 识别结果（字段与后端 snake_case 一致） */
export interface DrivingLicenseOcrData {
  plate_no: string
  vin: string
  brand: string
  model: string
  reg_date: string
  owner_name: string
  vehicle_type: string
  address: string
  use_character?: string
  engine_no?: string
  issue_date?: string
  file_no?: string
  approved_passengers?: string
  total_mass?: string
  curb_weight?: string
  approved_load?: string
  overall_dimensions?: string
  towing_capacity?: string
  remarks?: string
  inspection_record?: string
  register_no?: string
  status?: number
}

export interface DrivingLicenseOcrResult {
  success: boolean
  message: string
  data?: DrivingLicenseOcrData
  image_url?: string
  vin_valid?: boolean
}
