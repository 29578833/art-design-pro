import type { AcceptHplx, AcceptSyq } from '@/types/recycle/accept'
import type { ArchiveDictOption, ArchivePhotoItem, ArchiveSceneOption } from './types'

/** 车辆属地选项。 */
export const HPLX_OPTIONS: ArchiveSceneOption<AcceptHplx>[] = [
  { value: 1, label: '沪牌机动车', desc: '上海本地登记，需完整车辆信息' },
  { value: 2, label: '外牌机动车', desc: '非沪登记车辆' },
  { value: 3, label: '非车管（场内）', desc: '场内非机动车管理车辆' }
]

/** 所有权类型选项。 */
export const SYQ_OPTIONS: ArchiveSceneOption<AcceptSyq>[] = [
  { value: 2, label: '个人车辆', desc: '自然人登记，需身份证实名认证' },
  { value: 1, label: '企业/单位/机构车辆', desc: '法人单位登记，需营业执照认证' }
]

/** 企业证件类型选项。 */
export const COMPANY_ID_TYPE_OPTIONS: ArchiveDictOption[] = [
  { label: '统一社会信用代码', value: 'N' },
  { label: '组织机构代码证书', value: 'B' },
  { label: '单位注销证明', value: 'J' },
  { label: '驻华机构证明', value: 'L' },
  { label: '个体工商户营业执照注册号', value: 'P' }
]

/** 流程步骤。 */
export const ARCHIVE_STEPS = [
  { id: 1, label: '所有人信息' },
  { id: 2, label: '车辆信息' },
  { id: 3, label: '代理人信息' },
  { id: 4, label: '实名认证' },
  { id: 5, label: '影像材料' }
]

export const FALLBACK_HPZL: ArchiveDictOption[] = [
  '大型汽车',
  '小型汽车',
  '使馆汽车',
  '领馆汽车',
  '境外汽车',
  '外籍汽车',
  '教练汽车',
  '营运汽车',
  '摩托车',
  '轻便摩托车',
  '挂车',
  '农用运输车'
].map((t, i) => ({ label: t, value: String(i + 1) }))

export const FALLBACK_SYXZ: ArchiveDictOption[] = [
  '非营运',
  '营运',
  '出租',
  '教练',
  '警用',
  '消防',
  '救护',
  '工程作业'
].map((t) => ({ label: t, value: t }))

export const FALLBACK_RLZL: ArchiveDictOption[] = [
  '汽油',
  '柴油',
  '纯电动',
  '混合动力',
  '天然气',
  '液化气',
  '其他'
].map((t) => ({ label: t, value: t }))

/** 拆解只读照片配置。 */
export const DISMANTLE_PHOTO_ITEMS: ArchivePhotoItem[] = [
  { label: '车架照', field: 'cjzp' },
  { label: '发动机照', field: 'fdjzp' },
  { label: '变速箱照', field: 'bsqzp' },
  { label: '方向器照', field: 'fxjzp' },
  { label: '前桥照', field: 'qqzp' },
  { label: '后桥照', field: 'hqzp' },
  { label: '钢印部照片', field: 'gybwzp' }
]

/** 注销只读照片配置。 */
export const CANCEL_PHOTO_ITEMS: ArchivePhotoItem[] = [
  { label: '销毁号牌照', field: 'xhhpzp' },
  { label: '注销证明', field: 'zxzmzp' },
  { label: '领取人', field: 'lqrsfz1zp' }
]

/** 拖车只读照片配置。 */
export const TOW_READONLY_ITEMS: ArchivePhotoItem[] = [
  { label: '拖车单', field: 'tcjczp' },
  { label: '整车照', field: 'zczp' },
  { label: '车架拓印照', field: 'gyzp' },
  { label: '车架号照', field: 'cjhzp' },
  { label: '发动机照', field: 'fdjhzp' }
]

/** 所有人证件 OCR 字段映射。 */
export const OWNER_OCR_KEY: Partial<Record<string, string>> = {
  syrzp: 'license',
  sfz1zp: 'id_front',
  sfz2zp: 'id_back'
}

/** 车辆证件 OCR 字段映射。 */
export const VEHICLE_OCR_KEY: Partial<Record<string, string>> = {
  xszzp: 'driving_front',
  xszzpfy: 'driving_back',
  xszbmzp: 'driving_both',
  czzp: 'cert'
}

/** 代理人证件 OCR 字段映射。 */
export const AGENT_OCR_KEY: Partial<Record<string, string>> = {
  jbrsfz1zp: 'agent_front',
  jbrsfz2zp: 'agent_back'
}
