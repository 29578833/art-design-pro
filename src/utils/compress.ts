/**
 * 图片压缩工具：上传前在浏览器端压缩大图，降低上传体积与加载压力。
 *
 * 使用方式：
 * ```ts
 * const compressed = await compressImage(file)
 * formData.append('file', compressed)
 * ```
 *
 * 说明：
 * - 仅处理常见栅格图片（JPEG / PNG / WebP），GIF / SVG / PDF 等一律原样返回；
 * - 低于阈值的小图自动跳过压缩，避免无谓解码；
 * - 压缩后体积未变小或解析 / 导出失败时，一律回退为原图，保证上传不被中断。
 */

export interface ImageCompressOptions {
  /** 最长边像素上限，超出则等比缩放，默认 1920 */
  maxDimension?: number
  /** JPEG / WebP 输出质量（0-1），默认 0.8 */
  quality?: number
  /** 小于该字节数的图片不压缩，默认 500KB */
  thresholdBytes?: number
  /** 强制压缩（忽略 thresholdBytes），默认 false */
  force?: boolean
}

const COMPRESSIBLE_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp'])
const DEFAULT_MAX_DIMENSION = 1920
const DEFAULT_QUALITY = 0.8
const DEFAULT_THRESHOLD_BYTES = 500 * 1024

function isImageType(type: string): boolean {
  return COMPRESSIBLE_TYPES.has(type)
}

/** 按文件名后缀推断图片 MIME（用于补全缺失的 type） */
function guessImageTypeFromName(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase() ?? ''
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg'
  if (ext === 'png') return 'image/png'
  if (ext === 'webp') return 'image/webp'
  return ''
}

/** 判断该文件是否为可压缩的栅格图片 */
export function isCompressibleImage(file: Blob): boolean {
  return isImageType(file.type || '')
}

/**
 * 将文件规范化为 File：已是 File 则原样返回，否则包裹为 File。
 * 该函数仅在无需压缩时用于保持原始字节不变。
 */
function normalizeFile(source: File | Blob, name: string, mime: string): File {
  if (source instanceof File) return source
  return new File([source], name, { type: mime })
}

function loadImage(file: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('图片解析失败'))
    }
    img.src = url
  })
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob)
        else reject(new Error('图片导出失败'))
      },
      type,
      quality
    )
  })
}

function nameFromMime(mime: string): string {
  return `compressed-${Date.now()}.${mime.split('/')[1] || 'png'}`
}

/**
 * 压缩图片。
 * @param source 待压缩的图片（File 或 Blob）
 * @param options 压缩参数
 * @returns 压缩后的 File；若无需压缩或压缩失败，返回原文件字节
 */
export async function compressImage(
  source: File | Blob,
  options: ImageCompressOptions = {}
): Promise<File> {
  const {
    maxDimension = DEFAULT_MAX_DIMENSION,
    quality = DEFAULT_QUALITY,
    thresholdBytes = DEFAULT_THRESHOLD_BYTES,
    force = false
  } = options

  const name = source instanceof File ? source.name : nameFromMime(source.type || 'image/png')
  const mime = source.type || guessImageTypeFromName(name)

  // 仅压缩常见栅格图片
  if (!isImageType(mime)) {
    return normalizeFile(source, name, mime)
  }

  // 小图直接返回，避免无谓解码
  if (!force && source.size <= thresholdBytes) {
    return normalizeFile(source, name, mime)
  }

  try {
    const img = await loadImage(source)
    const naturalWidth = img.naturalWidth
    const naturalHeight = img.naturalHeight
    if (!naturalWidth || !naturalHeight) {
      return normalizeFile(source, name, mime)
    }

    const longest = Math.max(naturalWidth, naturalHeight)
    const scale = Math.min(1, maxDimension / longest)
    const width = Math.max(1, Math.round(naturalWidth * scale))
    const height = Math.max(1, Math.round(naturalHeight * scale))

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) return normalizeFile(source, name, mime)

    ctx.drawImage(img, 0, 0, width, height)

    // PNG 保留无损，其余按指定质量重新编码
    const outputMime = mime === 'image/png' ? 'image/png' : mime
    const blob = await canvasToBlob(canvas, outputMime, quality)

    // 压缩后未变小 → 保留原图
    if (!blob.size || blob.size >= source.size) {
      return normalizeFile(source, name, mime)
    }

    const outputName = source instanceof File ? source.name : nameFromMime(outputMime)
    return new File([blob], outputName, { type: outputMime })
  } catch {
    // 解析或导出失败：回退为原图
    return normalizeFile(source, name, mime)
  }
}
