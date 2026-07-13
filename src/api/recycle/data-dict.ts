import request from '@/utils/http'
import type {
  DataDictCategory,
  DataDictCategorySaveParams,
  DataDictItem,
  DataDictSaveParams,
  DataDictSearchParams,
  DataDictStatus
} from '@/types/recycle/system'
import type { CllxCascadeNode } from '@/types/recycle/data-dict'

function resolvePagination(params?: {
  current?: number
  size?: number
  page?: number
  limit?: number
}) {
  return {
    page: Number(params?.page ?? params?.current ?? 1),
    limit: Number(params?.limit ?? params?.size ?? 200)
  }
}

/** 车辆类型级联树 */
export function fetchCllxCascade() {
  return request.get<CllxCascadeNode[]>({
    url: '/scrap/data_dict/cllx_cascade'
  })
}

/** 左侧：系统数据字典分类列表 */
export async function fetchDataDictCategoryList(params?: { status?: number | string }) {
  const res = await request.get<{ list: DataDictCategory[]; count: number }>({
    url: '/system/crud/data_dictionary_list',
    params: {
      status: params?.status ?? '',
      page: 1,
      limit: 200
    }
  })
  return {
    list: res.list || [],
    count: res.count || 0
  }
}

/** 获取分类新增/编辑表单（FormBuilder，可用于校验接口可用） */
export function fetchDataDictCategoryForm(id = 0) {
  return request.get({
    url: `/system/crud/data_dictionary_list/create/${id}`
  })
}

/** 保存字典分类（id=0 新增） */
export function fetchDataDictCategorySave(id: number, data: DataDictCategorySaveParams) {
  return request.post({
    url: `/system/crud/data_dictionary_list/save/${id}`,
    params: {
      name: data.name,
      mark: data.mark,
      level: data.level ?? 0,
      status: data.status ?? 1
    },
    showSuccessMessage: true
  })
}

/** 右侧：字典项列表 */
export async function fetchDataDictList(params?: DataDictSearchParams) {
  const paging = resolvePagination(params)
  const res = await request.get<{ list: DataDictItem[]; count: number }>({
    url: '/scrap/data_dict/list',
    params: {
      dict_type: params?.dict_type || '',
      dict_label: params?.dict_label || '',
      status: params?.status !== undefined && params?.status !== '' ? params.status : '',
      ...paging
    }
  })
  return {
    list: res.list || [],
    count: res.count || 0
  }
}

/** 新增字典项 */
export function fetchDataDictCreate(data: DataDictSaveParams) {
  return request.post({
    url: '/scrap/data_dict/create',
    params: {
      dict_type: data.dict_type,
      dict_label: data.dict_label,
      dict_value: data.dict_value,
      sort: data.sort ?? 0,
      status: data.status ?? 1,
      remark: data.remark || ''
    },
    showSuccessMessage: true
  })
}

/** 修改字典项 */
export function fetchDataDictUpdate(id: number, data: DataDictSaveParams) {
  return request.post({
    url: `/scrap/data_dict/update/${id}`,
    params: {
      dict_type: data.dict_type,
      dict_label: data.dict_label,
      dict_value: data.dict_value,
      sort: data.sort ?? 0,
      status: data.status ?? 1,
      remark: data.remark || ''
    },
    showSuccessMessage: true
  })
}

/** 删除字典项 */
export function fetchDataDictDelete(id: number) {
  return request.del({
    url: `/scrap/data_dict/delete/${id}`,
    showSuccessMessage: true
  })
}

/** 切换字典项状态 */
export function fetchDataDictStatus(id: number, status: DataDictStatus) {
  return request.put({
    url: `/scrap/data_dict/status/${id}`,
    params: { status },
    showSuccessMessage: true
  })
}
