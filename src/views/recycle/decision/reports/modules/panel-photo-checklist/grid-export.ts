import * as XLSX from 'xlsx'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/store/modules/user'
import { buildPhotoChecklistFileUrl, fetchPhotoChecklist } from '@/api/recycle/report'
import type {
  PhotoChecklistItem,
  PhotoChecklistParams
} from '@/types/recycle/decision/reports/report'
import { PHOTO_COLS } from './grid-columns'

export const PC_REPORT_TITLE = '鑫广再生资源（上海）有限公司  机动车报废拆解清单'

async function downloadBlob(url: string, filename: string) {
  const userStore = useUserStore()
  const res = await fetch(url, {
    headers: {
      'Authori-zation': `Bearer ${userStore.accessToken}`
    }
  })
  if (!res.ok) {
    const text = await res.text()
    try {
      const json = JSON.parse(text)
      throw new Error(json.msg || '下载失败')
    } catch (e) {
      if (e instanceof Error && e.message !== '下载失败') throw e
      throw new Error('下载失败')
    }
  }
  const blob = await res.blob()
  const blobUrl = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = blobUrl
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(blobUrl)
}

function exportFrontendExcel(list: PhotoChecklistItem[], start: string, end: string) {
  const headers = [
    '序号',
    '车牌号',
    '拆解日期',
    '掀顶/断粱时间',
    '五大总成拆解时间',
    '已上传数量',
    ...PHOTO_COLS.map((c) => c.label)
  ]
  const body = list.map((r, i) => [
    i + 1,
    r.plate_no,
    r.dismantle_date,
    r.roof_cut_time,
    r.assembly_dismantle_time,
    r.uploaded,
    ...PHOTO_COLS.map((c) => (r[c.key] ? '✓' : '—'))
  ])
  const ws = XLSX.utils.aoa_to_sheet([
    [PC_REPORT_TITLE],
    [`查询区间：${start} — ${end}`],
    headers,
    ...body
  ])
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: headers.length - 1 } }
  ]
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '机动车报废拆解清单')
  XLSX.writeFile(wb, `机动车报废拆解清单_${start}_${end}.xlsx`)
}

export function usePhotoChecklistExport() {
  const exporting = ref(false)
  const downloading = ref(false)

  async function exportExcel(params: PhotoChecklistParams) {
    if (exporting.value) return
    exporting.value = true
    try {
      const url = buildPhotoChecklistFileUrl('photo_checklist_export', params)
      await downloadBlob(url, `机动车报废拆解清单_${params.start_date}_${params.end_date}.xlsx`)
      ElMessage.success('导出成功')
    } catch {
      try {
        const res = await fetchPhotoChecklist({ ...params, page: 1, limit: 200 })
        exportFrontendExcel(res.list || [], params.start_date || '', params.end_date || '')
        ElMessage.success('导出成功')
      } catch {
        ElMessage.error('导出失败')
      }
    } finally {
      exporting.value = false
    }
  }

  async function downloadPhotos(params: PhotoChecklistParams, plateNo?: string) {
    if (downloading.value) return
    downloading.value = true
    try {
      const url = buildPhotoChecklistFileUrl('photo_checklist_photos', {
        ...params,
        plate_no: plateNo || params.plate_no
      })
      await downloadBlob(
        url,
        `photos_${plateNo || 'all'}_${params.start_date}_${params.end_date}.zip`
      )
      ElMessage.success('下载成功')
    } catch (e) {
      ElMessage.error(e instanceof Error ? e.message : '下载失败')
    } finally {
      downloading.value = false
    }
  }

  return { exporting, downloading, exportExcel, downloadPhotos }
}
