import type { AcceptHplx, AcceptSyq } from '@/types/recycle/accept'

/** 下拉字典选项。 */
export interface ArchiveDictOption {
  /** 展示名称。 */
  label: string
  /** 字典值。 */
  value: string
}

/** 受理场景选项。 */
export interface ArchiveSceneOption<T extends AcceptHplx | AcceptSyq> {
  /** 场景值。 */
  value: T
  /** 场景名称。 */
  label: string
  /** 场景说明。 */
  desc: string
}

/** 档案步骤。 */
export interface ArchiveStep {
  /** 步骤序号。 */
  id: number
  /** 步骤名称。 */
  label: string
}

/** 关联业务单据信息。 */
export interface ArchiveLinkInfo {
  /** 回收订单号。 */
  order_no: string
  /** 车辆档案单号。 */
  archive_no: string
  /** 拖车订单号。 */
  tow_order_no: string
  /** 线索单号。 */
  lead_no: string
}

/** 所有人表单。 */
export interface ArchiveOwnerForm {
  /** 所有人姓名或企业名称。 */
  syr: string
  /** 所有人身份证号或统一社会信用代码。 */
  sfzmhm: string
  /** 联系电话。 */
  dh: string
  /** 联系地址或企业注册地址。 */
  dz: string
  /** 身份证明名称或证件类型编码。 */
  sfzmmc: string
  /** 号牌种类。 */
  hpzl: string
  /** 所有人实名认证状态，1 表示已认证。 */
  syrsmrz: string
  /** 身份证是否异地标记。 */
  sfyd: string
  /** 注册标记。 */
  zcbj: string
  /** 所有权类型。 */
  syq: string
}

/** 车辆及交付结算表单。 */
export interface ArchiveVehicleForm {
  /** 车辆识别代号（车架号）。 */
  clsbdh: string
  /** 号牌号码。 */
  hphm: string
  /** 号牌种类。 */
  hpzl: string
  /** 车辆类型。 */
  cllx: string
  /** 使用性质。 */
  syxz: string
  /** 初次登记日期。 */
  ccdjrq: string
  /** 燃料种类。 */
  rlzl: string
  /** 发动机号码。 */
  fdjh: string
  /** 发动机型号。 */
  fdjxh: string
  /** 行驶证编号。 */
  xszbh: string
  /** 机动车登记证书编号。 */
  czbh: string
  /** 车辆品牌。 */
  clpp1: string
  /** 车辆型号。 */
  clxh: string
  /** 品牌型号组合值。 */
  ppxh: string
  /** 外廓长度，单位毫米。 */
  cwkc: string
  /** 外廓宽度，单位毫米。 */
  cwkk: string
  /** 外廓高度，单位毫米。 */
  cwkg: string
  /** 功率，单位千瓦。 */
  gl: string
  /** 排量，单位毫升。 */
  pl: string
  /** 核定载客人数。 */
  hdzk: string
  /** 整备质量，单位千克。 */
  zbzl: string
  /** 总质量，单位千克。 */
  zzl: string
  /** 车身颜色。 */
  csys: string
  /** 送货方式，tow 为拖车，self 为自送。 */
  delivery_method: string
  /** 拖车上门取车地址。 */
  tow_pickup_address: string
  /** 拖车取车联系人。 */
  tow_pickup_contact: string
  /** 拖车取车联系电话。 */
  tow_pickup_phone: string
  /** 自行送车地址。 */
  self_delivery_address: string
  /** 自行送车联系人。 */
  self_delivery_name: string
  /** 自行送车联系电话。 */
  self_delivery_phone: string
  /** 结算类型。 */
  settlement_type: string
  /** 结算方式。 */
  settlement_method: string
  /** 结算金额，单位元。 */
  settlement_amount: string
  /** 开户姓名或单位名称。 */
  bank_name: string
  /** 开户银行。 */
  bank_branch: string
  /** 银行卡号。 */
  bank_card_no: string
  /** 备注说明。 */
  remark: string
}

/** 代理人表单。 */
export interface ArchiveAgentForm {
  /** 代理人姓名。 */
  jbr: string
  /** 代理人身份证号码。 */
  jbrsfzmhm: string
  /** 代理人联系电话。 */
  jbrdh: string
  /** 代理人实名认证状态，1 表示已认证。 */
  jbrsmrz: string
}

/** 所有人证件图片。 */
export interface ArchiveOwnerImages {
  /** 所有人主证件照或营业执照。 */
  syrzp: string
  /** 所有人身份证正面。 */
  sfz1zp: string
  /** 所有人身份证反面。 */
  sfz2zp: string
  /** 证件缺失情况说明。 */
  qksmzp: string
  /** 产权变更页照片。 */
  blpzzp: string
}

/** 车辆证件图片。 */
export interface ArchiveVehicleImages {
  /** 行驶证正页。 */
  xszzp: string
  /** 行驶证副页。 */
  xszzpfy: string
  /** 行驶证正副本背面。 */
  xszbmzp: string
  /** 机动车登记证书一二页。 */
  czzp: string
}

/** 代理人证件图片。 */
export interface ArchiveAgentImages {
  /** 代理人身份证正面。 */
  jbrsfz1zp: string
  /** 代理人身份证反面。 */
  jbrsfz2zp: string
  /** 委托说明图片。 */
  jbrzp: string
}

/** 进场材料图片。 */
export interface ArchiveMaterialImages {
  /** 拖车单图片。 */
  photo_front: string
  /** 整车照片。 */
  photo_side: string
  /** 车架拓印照片。 */
  photo_back: string
  /** 车架号照片。 */
  photo_interior: string
}

/** 只读照片配置。 */
export interface ArchivePhotoItem {
  /** 照片名称。 */
  label: string
  /** 后端图片字段名。 */
  field: string
}

/** 商务部同步的缓存文件。 */
export interface ArchiveCacheFile {
  /** 可访问的文件地址。 */
  url?: string
}

/** OCR 任务状态表，键为识别任务名称。 */
export type ArchiveOcrState = Record<string, boolean>
