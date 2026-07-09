import request from '@/utils/http'
import type { SignatureTemplate } from '@/types/recycle/order'

/** 签名模板列表 */
export function fetchSignTemplates(): Promise<SignatureTemplate[]> {
  return request.get({ url: '/scrap/sign/templates' })
}

/** 保存签名模板 */
export function fetchSaveTemplate(name: string, signUrl: string): Promise<SignatureTemplate> {
  return request.post({ url: '/scrap/sign/save_template', data: { name, sign_url: signUrl } })
}

/** 删除签名模板 */
export function fetchDeleteTemplate(id: number): Promise<void> {
  return request.post({ url: '/scrap/sign/delete_template', data: { id } })
}

/**
 * 按附件 ID 签名（支持批量，逗号分隔）
 * @param attachIds 附件 ID 数组
 * @param signUrl   签名图片 URL（需先通过 /file/upload 上传获得）
 */
export function fetchSignAttachments(
  attachIds: number[],
  signUrl: string
): Promise<{ count: number }> {
  return request.post({
    url: '/scrap/sign/sign',
    data: { attach_id: attachIds.join(','), sign_url: signUrl }
  })
}

/**
 * 按订单 ID 签名（签该订单所有待签附件）
 * @param orderIds 订单 ID 数组（支持多个）
 * @param signUrl  签名图片 URL
 */
export function fetchSignOrder(orderIds: number[], signUrl: string): Promise<{ count: number }> {
  return request.post({
    url: '/scrap/sign/sign_order',
    data: { order_id: orderIds.join(','), sign_url: signUrl }
  })
}

/** 获取指定订单的附件列表（含签名状态，独立接口） */
export function fetchOrderAttachments(orderId: number) {
  return request.get({ url: `/scrap/sign/order_attachments/${orderId}` })
}
