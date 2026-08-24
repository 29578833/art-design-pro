import { fetchAcceptCheckToken } from '@/api/recycle/accept'

/**
 * 车信盟 Token 有效性检测。
 *
 * `ensureCxmToken()` 调用 /scrap/bfdj/check_token 检测车信盟 Token：
 * - 有效：返回 true，调用方继续执行原操作；
 * - 无效 / 检测失败：置 `cxmLoginVisible = true` 弹出车信盟登录框，返回 false，调用方中止原操作。
 *
 * 与 CxmLoginDialog 配合使用：
 * ```ts
 * const { cxmLoginVisible, ensureCxmToken } = useCxmTokenCheck()
 * if (!(await ensureCxmToken())) return
 * ```
 */
export function useCxmTokenCheck() {
  /** 车信盟登录框显隐 */
  const cxmLoginVisible = ref(false)
  /** Token 检测中，避免并发重复弹出 */
  const cxmTokenChecking = ref(false)

  async function ensureCxmToken(): Promise<boolean> {
    if (cxmTokenChecking.value) return false
    cxmTokenChecking.value = true
    try {
      const res = await fetchAcceptCheckToken()
      // 仅当接口明确返回“无效”时视为失效；其余（true / 无数据 / 未显式标记）视为有效
      const invalid =
        res === false ||
        (res != null &&
          typeof res === 'object' &&
          ((res as { valid?: boolean }).valid === false ||
            (res as { token_valid?: boolean }).token_valid === false))
      if (invalid) {
        cxmLoginVisible.value = true
        return false
      }
      return true
    } catch {
      // 检测失败（如 Token 未配置 / 已失效导致接口报错）按无效处理，弹出登录框
      cxmLoginVisible.value = true
      return false
    } finally {
      cxmTokenChecking.value = false
    }
  }

  return { cxmLoginVisible, cxmTokenChecking, ensureCxmToken }
}
