/** 号牌类型：1=沪牌 2=外牌 3=非车管 */
export type AcceptHplx = 1 | 2 | 3

/** 所有权：1=单位/企业 2=个人（以 Service 注释与 submit 逻辑为准） */
export type AcceptSyq = 1 | 2

/** 受理人字典选项 */
export interface AcceptDictUsernameOption {
  label: string
  value: string
}

/** 商务部受理列表筛选 */
export interface AcceptListParams {
  current?: number
  size?: number
  page?: number
  limit?: number
  /** 是否车管：1=车管，0=非车管 */
  is_vehicle_mgmt?: '' | 0 | 1
  /** 车架号 */
  clsbdh?: string
  /** 受理人 */
  yhsjhm?: string
  /** 来源平台 */
  platform?: string
  /** 所有人 */
  syr?: string
  /** 所有人实名认证状态 */
  syrsmrz?: string
  /** 代理人 */
  jbr?: string
  /** 代理人实名认证状态 */
  jbrsmrz?: string
  /** 受理状态 */
  zt?: string
  startsj?: string
  endsj?: string
}

/** 商务部受理列表项 */
export interface AcceptListItem {
  /** 车信盟采集 ID，未提交前可能为空 */
  id: string
  /** 本地车辆 ID */
  vehicle_id: number
  owner_sync_id?: number
  order_no?: string
  order_status?: number | string
  clsbdh?: string
  hphm?: string
  vehicle_type?: string
  cllx?: string
  cllx_name?: string
  is_vehicle_mgmt?: boolean
  syr?: string
  dh?: string
  syr_verified?: boolean
  jbr?: string
  jbrdh?: string
  jbr_verified?: boolean
  yhsjhm_dictText?: string
  accept_time?: string
  bidui_text?: string
  bidui_type?: string
  zt?: string
  zt_text?: string
  is_submitted_commerce?: boolean | number
  action?: unknown[]
}

/** 商务部受理分页数据 */
export type AcceptList = Api.Common.PaginatedResponse<AcceptListItem>

/** 初始化表单入参 */
export interface AcceptInitFormParams {
  /** 号牌类型 */
  hplx: AcceptHplx
  /** 所有权 */
  syq: AcceptSyq
  /** 车辆 ID */
  vehicle_id: number
}

/** 初始化表单返回 */
export interface AcceptInitFormResult {
  /** 所有人同步表 ID */
  owner_sync_id: number
  /** 采集 ID（提交前可能为空） */
  cjid?: string
  /** 车辆 ID */
  vehicle_id: number
  /** 号牌类型 */
  hplx: AcceptHplx
  /** 所有权 */
  syq: AcceptSyq
  /** 提示文案 */
  message?: string
}

/** 属地回显 */
export interface AcceptOriginFields {
  /** 是否异地：0 本地 1 外地 */
  sywd?: string
  /** 是否车管：1 车管 0 非车管 */
  zcbj?: string
  /** 所有权 */
  syq?: string
  /** 号牌类型 */
  hplx?: string | number
}

/** 所有人信息（接口原字段） */
export interface AcceptOwnerData {
  syr?: string
  sfzmhm?: string
  dh?: string
  dz?: string
  sfzmmc?: string
  hpzl?: string
  syrsmrz?: string
  sfyd?: string
  zcbj?: string
  syq?: string
  zc?: string
  hplx?: string
  [key: string]: unknown
}

/** 车辆信息（接口原字段） */
export interface AcceptVehicleData {
  clsbdh?: string
  hphm?: string
  hpzl?: string
  cllx?: string
  syxz?: string
  ccdjrq?: string
  rlzl?: string
  fdjh?: string
  fdjxh?: string
  xszbh?: string
  czbh?: string
  clpp1?: string
  clxh?: string
  ppxh?: string
  cwkc?: string
  cwkk?: string
  cwkg?: string
  gl?: string
  pl?: string
  hdzk?: string
  zbzl?: string
  zzl?: string
  csys?: string
  delivery_method?: string
  tow_pickup_address?: string
  tow_pickup_contact?: string
  tow_pickup_phone?: string
  self_delivery_address?: string
  self_delivery_name?: string
  self_delivery_phone?: string
  settlement_type?: string
  settlement_method?: string
  settlement_amount?: string | number
  bank_name?: string
  bank_branch?: string
  bank_card_no?: string
  remark?: string
  [key: string]: unknown
}

/** 代理人信息（接口原字段） */
export interface AcceptAgentData {
  has_agent?: number | string
  jbr?: string
  jbrsfzmhm?: string
  jbrdh?: string
  jbrsmrz?: string
  [key: string]: unknown
}

/** 同步表回显数据 */
export interface AcceptSyncFiles {
  id?: string
  cjid?: string
  owner?: AcceptOwnerData
  vehicle?: AcceptVehicleData
  agent?: AcceptAgentData
  owner_images?: Record<string, string>
  vehicle_images?: Record<string, string>
  agent_images?: Record<string, string>
  is_submitted_commerce?: boolean | number
  djid?: string
}

/** 保存所有人 */
export interface AcceptSaveOwnerParams extends AcceptOwnerData {
  vehicle_id: number
  syrzp?: string
  sfz1zp?: string
  sfz2zp?: string
  qksmzp?: string
  gyzp?: string
  [key: string]: unknown
}

/** 保存车辆 */
export interface AcceptSaveVehicleParams extends AcceptVehicleData {
  vehicle_id: number
  hplx?: AcceptHplx
  xszzp?: string
  xszzpfy?: string
  xszbmzp?: string
  czzp?: string
}

/** 保存代理人 */
export interface AcceptSaveAgentParams extends AcceptAgentData {
  vehicle_id: number
  jbrzp?: string
  jbrsfz1zp?: string
  jbrsfz2zp?: string
  lqrsfz1zp?: string
  lqrsfz2zp?: string
  qksmzp?: string
}

/** 实名认证发短信 */
export interface AcceptAuthSmsParams {
  cjid: string
  tel: string
  /** syr=所有人 dlr=代理人 */
  type: 'syr' | 'dlr'
  verifyType?: 'sms' | 'scan'
}

/** 提交结果 */
export interface AcceptSubmitResult {
  vin?: string
  plate_no?: string
  owner_name?: string
  owner_phone?: string
  submit_time?: string
  djid?: string
  is_submitted?: boolean
  company_name?: string
  certificate_no?: string
  vehicle_plate?: string
  vehicle_vin?: string
  register_date?: string
  commerce_dept?: string
  handler?: string
  handler_date?: string
}

/** 上传图片返回 */
export interface AcceptUploadResult {
  url: string | { src?: string; url?: string }
}

/** OCR 身份证识别结果（字段以接口为准） */
export interface AcceptIdCardOcrData {
  name?: string
  id_number?: string
  address?: string
  /** 兼容可能字段 */
  owner_name?: string
  sfzmhm?: string
  dz?: string
  [key: string]: unknown
}

/** OCR 营业执照 */
export interface AcceptLicenseOcrData {
  company_name?: string
  credit_code?: string
  address?: string
  name?: string
  [key: string]: unknown
}

/** OCR 产证（字段与 recognize_registration_cert 一致） */
export interface AcceptRegCertOcrData {
  certificate_no?: string
  register_no?: string
  register_date?: string
  vin?: string
  engine_no?: string
  engine_model?: string
  brand?: string
  model?: string
  vehicle_type?: string
  body_color?: string
  fuel_type?: string
  displacement?: string
  power?: string
  overall_length?: string | number
  overall_width?: string | number
  overall_height?: string | number
  total_mass?: string
  approved_passengers?: string
  plate_no?: string
  [key: string]: unknown
}
