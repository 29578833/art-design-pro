import request from '@/utils/http'
import type {
  MiniAgreementItem,
  MiniAgreementSaveParams,
  MiniAgreementType
} from '@/types/recycle/miniprogram'

/** 获取协议内容 */
export function fetchAgreement(type: MiniAgreementType | number) {
  return request.get<MiniAgreementItem>({
    url: `/setting/get_agreement/${type}`
  })
}

/** 保存协议内容 */
export function fetchAgreementSave(data: MiniAgreementSaveParams) {
  return request.post({
    url: '/setting/save_agreement',
    params: {
      id: data.id || 0,
      type: data.type,
      title: data.title,
      content: data.content,
      version: data.version || '1.0',
      effective_date: data.effective_date || ''
    },
    showSuccessMessage: true
  })
}
