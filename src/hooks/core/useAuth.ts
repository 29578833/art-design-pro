/**
 * useAuth - 权限验证管理
 *
 * 提供统一的权限验证功能，支持前端和后端两种权限模式。
 * 用于控制页面按钮、操作等功能的显示和访问权限。
 *
 * ## 主要功能
 *
 * 1. 权限检查 - 检查用户是否拥有指定的权限标识
 * 2. 双模式支持 - 自动适配前端模式和后端模式的权限验证
 * 3. 前端模式 - 从用户信息中获取按钮权限列表（/menus 的 unique，如 ['scrap-order-audit-approve']）
 * 4. 后端模式 - 从路由 meta 配置中获取权限列表（如 [{ authMark: 'add' }]）
 *
 * ## 使用示例
 *
 * ```typescript
 * const { hasAuth } = useAuth()
 *
 * if (hasAuth('scrap-order-audit-approve')) {
 *   // 显示审核通过按钮
 * }
 *
 * <el-button v-if="hasAuth('scrap-order-audit-reject')">审核驳回</el-button>
 * <el-button v-auth="'scrap-order-audit-approve'">审核通过</el-button>
 * ```
 *
 * @module useAuth
 * @author Art Design Pro Team
 */

import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useUserStore } from '@/store/modules/user'
import { router } from '@/router'
import type { AppRouteRecord } from '@/types/router'

type AuthItem = NonNullable<AppRouteRecord['meta']['authList']>[number]

/** 当前路由 meta.authList 中是否包含该权限标识 */
function hasRouteAuth(auth: string, authList?: AuthItem[]): boolean {
  const list = Array.isArray(authList) ? authList : []
  return list.some((item) => item?.authMark === auth)
}

/**
 * 检查是否拥有某权限标识（指令与组合式 API 共用）
 * 优先读用户 unique（info.buttons），再兼容路由 meta.authList
 */
export function checkAuth(auth: string): boolean {
  if (!auth) return false
  const userStore = useUserStore()
  const buttons = userStore.info?.buttons ?? []
  if (Array.isArray(buttons) && buttons.includes(auth)) return true

  const authList = router.currentRoute.value.meta.authList as AuthItem[] | undefined
  return hasRouteAuth(auth, authList)
}

export const useAuth = () => {
  const route = useRoute()
  const { info } = storeToRefs(useUserStore())

  /**
   * 检查是否拥有某权限标识
   * 在 computed 中调用时会追踪 unique / 路由权限变化
   */
  const hasAuth = (auth: string): boolean => {
    if (!auth) return false
    const buttons = info.value?.buttons ?? []
    if (Array.isArray(buttons) && buttons.includes(auth)) return true
    return hasRouteAuth(auth, route.meta.authList as AuthItem[] | undefined)
  }

  return {
    hasAuth
  }
}
