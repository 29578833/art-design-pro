const TENCENT_MAP_SCRIPT_ID = 'tencent-map-gl-js'

let loadPromise: Promise<void> | null = null

/** 获取腾讯地图 Key */
export function getTencentMapKey(): string {
  return import.meta.env.VITE_TENCENT_MAP_KEY || ''
}

/** 动态加载腾讯地图 GL JS SDK */
export function loadTencentMapSdk(): Promise<void> {
  const key = getTencentMapKey()
  if (!key) {
    return Promise.reject(new Error('未配置腾讯地图 Key'))
  }
  if (window.TMap) {
    return Promise.resolve()
  }
  if (loadPromise) {
    return loadPromise
  }

  loadPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById(TENCENT_MAP_SCRIPT_ID) as HTMLScriptElement | null
    if (existing) {
      if (window.TMap) {
        resolve()
        return
      }
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', () => reject(new Error('腾讯地图 SDK 加载失败')))
      return
    }

    const script = document.createElement('script')
    script.id = TENCENT_MAP_SCRIPT_ID
    script.charset = 'utf-8'
    script.src = `https://map.qq.com/api/gljs?v=1.exp&libraries=service&key=${key}`
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('腾讯地图 SDK 加载失败'))
    document.head.appendChild(script)
  })

  return loadPromise
}
