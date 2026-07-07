import type {
  GradeStatItem,
  PartnerFormData,
  PartnerList,
  PartnerSearchParams,
  RecyclePartner
} from '@/types/recycle/customer'

/** Mock 数据 */
const MOCK_PARTNERS: RecyclePartner[] = [
  {
    id: 'C001',
    code: 'KH20260001',
    name: '张建国',
    phone: '138****8001',
    category: 'customer',
    type: 'individual',
    grade: 'vip',
    cooperationType: 'individual',
    idCard: '310101****1234',
    address: '上海市浦东新区张江路100号',
    creditLimit: 50000,
    totalTradeAmount: 102000,
    totalVehicles: 12,
    lastDealDate: '2026-06-18',
    status: 'active',
    remark: '长期合作客户，信誉良好',
    createTime: '2025-01-15'
  },
  {
    id: 'C002',
    code: 'KH20260002',
    name: '上海鑫源物流有限公司',
    phone: '021-****8888',
    category: 'customer',
    type: 'enterprise',
    grade: 'vip',
    cooperationType: 'vehicle_supplier',
    enterprise: '上海鑫源物流有限公司',
    creditCode: '91310115****6789',
    contactPerson: '李总',
    address: '上海市宝山区月浦镇工业区',
    creditLimit: 200000,
    totalTradeAmount: 456000,
    totalVehicles: 38,
    lastDealDate: '2026-06-20',
    status: 'active',
    createTime: '2024-08-01'
  },
  {
    id: 'S001',
    code: 'GYS20260001',
    name: '华东拖车服务有限公司',
    phone: '021-****5566',
    category: 'supplier',
    type: 'enterprise',
    grade: 'normal',
    cooperationType: 'towing',
    enterprise: '华东拖车服务有限公司',
    creditCode: '91310120****1122',
    contactPerson: '王经理',
    address: '上海市嘉定区安亭镇',
    creditLimit: 80000,
    totalTradeAmount: 128000,
    totalVehicles: 0,
    lastDealDate: '2026-06-15',
    status: 'active',
    createTime: '2025-03-10'
  },
  {
    id: 'C003',
    code: 'KH20260003',
    name: '王丽华',
    phone: '139****5566',
    category: 'customer',
    type: 'individual',
    grade: 'normal',
    cooperationType: 'individual',
    idCard: '310104****5678',
    address: '上海市杨浦区控江路200号',
    creditLimit: 20000,
    totalTradeAmount: 28500,
    totalVehicles: 3,
    lastDealDate: '2026-05-10',
    status: 'active',
    createTime: '2025-11-20'
  },
  {
    id: 'S002',
    code: 'GYS20260002',
    name: '苏州绿色回收科技有限公司',
    phone: '0512-****1234',
    category: 'supplier',
    type: 'enterprise',
    grade: 'normal',
    cooperationType: 'product_buyer',
    enterprise: '苏州绿色回收科技有限公司',
    creditCode: '91320594****3456',
    contactPerson: '赵经理',
    address: '苏州市工业园区星湖街218号',
    creditLimit: 150000,
    totalTradeAmount: 320000,
    totalVehicles: 0,
    lastDealDate: '2026-04-22',
    status: 'active',
    createTime: '2025-05-10'
  },
  {
    id: 'C004',
    code: 'KH20260004',
    name: '刘明',
    phone: '150****7788',
    category: 'customer',
    type: 'individual',
    grade: 'potential',
    cooperationType: 'individual',
    idCard: '310106****9012',
    address: '上海市闵行区莘庄镇',
    creditLimit: 10000,
    totalTradeAmount: 0,
    totalVehicles: 0,
    lastDealDate: '—',
    status: 'active',
    createTime: '2026-06-01'
  },
  {
    id: 'S003',
    code: 'GYS20260003',
    name: '鑫广设备维修中心',
    phone: '021-****9900',
    category: 'supplier',
    type: 'enterprise',
    grade: 'normal',
    cooperationType: 'equipment',
    enterprise: '鑫广设备维修中心',
    creditCode: '91310118****7788',
    contactPerson: '周工',
    address: '上海市松江区九亭镇',
    creditLimit: 30000,
    totalTradeAmount: 56000,
    totalVehicles: 0,
    lastDealDate: '2026-03-08',
    status: 'active',
    createTime: '2025-08-20'
  },
  {
    id: 'C005',
    code: 'KH20260005',
    name: '陈志强',
    phone: '136****4433',
    category: 'customer',
    type: 'individual',
    grade: 'blacklist',
    cooperationType: 'individual',
    idCard: '310110****3456',
    address: '上海市松江区',
    creditLimit: 0,
    totalTradeAmount: 8500,
    totalVehicles: 1,
    lastDealDate: '2025-12-01',
    status: 'inactive',
    remark: '拒绝付款，列入黑名单',
    createTime: '2024-06-10'
  }
]

let partnerStore = [...MOCK_PARTNERS]

function filterPartners(params: PartnerSearchParams): RecyclePartner[] {
  const keyword = params.keyword?.trim().toLowerCase()

  return partnerStore.filter((item) => {
    const matchKeyword =
      !keyword ||
      item.name.toLowerCase().includes(keyword) ||
      item.phone.includes(keyword) ||
      item.code.toLowerCase().includes(keyword) ||
      (item.enterprise || '').toLowerCase().includes(keyword)

    const matchCategory =
      !params.category || params.category === 'all' || item.category === params.category
    const matchType = !params.type || params.type === 'all' || item.type === params.type
    const matchGrade = !params.grade || params.grade === 'all' || item.grade === params.grade
    const matchCooperationType =
      !params.cooperationType ||
      params.cooperationType === 'all' ||
      item.cooperationType === params.cooperationType
    const matchStatus = !params.status || params.status === 'all' || item.status === params.status

    return (
      matchKeyword &&
      matchCategory &&
      matchType &&
      matchGrade &&
      matchCooperationType &&
      matchStatus
    )
  })
}

function paginate<T>(list: T[], current = 1, size = 20): PartnerList {
  const start = (current - 1) * size
  const records = list.slice(start, start + size)

  return {
    records,
    current,
    size,
    total: list.length
  }
}

function generateCode(category: PartnerCategory): string {
  const prefix = category === 'customer' ? 'KH' : 'GYS'
  const year = new Date().getFullYear()
  const seq = String(partnerStore.length + 1).padStart(4, '0')
  return `${prefix}${year}${seq}`
}

/** 获取客户供应商列表 */
export function fetchPartnerList(params: PartnerSearchParams): Promise<PartnerList> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const filtered = filterPartners(params)
      resolve(paginate(filtered, params.current || 1, params.size || 20))
    }, 200)
  })
}

/** 获取分级统计 */
export function fetchPartnerGradeStats(
  params: Pick<PartnerSearchParams, 'category'>
): Promise<GradeStatItem[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const filtered = filterPartners({
        current: 1,
        size: 9999,
        category: params.category
      })

      const stats = (['vip', 'normal', 'potential', 'blacklist'] as const).map((grade) => ({
        grade,
        count: filtered.filter((item) => item.grade === grade).length
      }))

      resolve(stats)
    }, 100)
  })
}

/** 新增客户供应商 */
export function fetchCreatePartner(data: PartnerFormData): Promise<RecyclePartner> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const newPartner: RecyclePartner = {
        ...data,
        id: `P${String(partnerStore.length + 1).padStart(3, '0')}`,
        code: generateCode(data.category),
        totalVehicles: 0,
        totalTradeAmount: 0,
        lastDealDate: '—',
        createTime: new Date().toISOString().slice(0, 10)
      }
      partnerStore = [newPartner, ...partnerStore]
      resolve(newPartner)
    }, 200)
  })
}

/** 更新客户供应商 */
export function fetchUpdatePartner(id: string, data: PartnerFormData): Promise<RecyclePartner> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const index = partnerStore.findIndex((item) => item.id === id)
      if (index === -1) {
        reject(new Error('记录不存在'))
        return
      }

      partnerStore[index] = {
        ...partnerStore[index],
        ...data
      }
      resolve(partnerStore[index])
    }, 200)
  })
}
