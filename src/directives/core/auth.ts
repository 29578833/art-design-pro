/**
 * v-auth 权限指令
 *
 * 基于权限标识控制 DOM 元素的显示和隐藏。
 * 优先校验用户 unique（/menus 返回的 info.buttons），并兼容路由 meta.authList。
 * 如果用户没有对应权限，元素将从 DOM 中移除。
 *
 * ## 主要功能
 *
 * - 权限验证 - unique 权限码 + 路由 meta.authList
 * - DOM 控制 - 无权限时自动移除元素，而非隐藏
 * - 响应式更新 - 权限变化时自动更新元素状态
 *
 * ## 使用示例
 *
 * ```vue
 * <!-- 只有拥有 'add' 权限的用户才能看到新增按钮 -->
 * <el-button v-auth="'add'">新增</el-button>
 *
 * <!-- 只有拥有 'edit' 权限的用户才能看到编辑按钮 -->
 * <el-button v-auth="'edit'">编辑</el-button>
 *
 * <!-- 只有拥有 'delete' 权限的用户才能看到删除按钮 -->
 * <el-button v-auth="'delete'">删除</el-button>
 * ```
 *
 * ## 注意事项
 *
 * - 该指令会直接移除 DOM 元素，而不是使用 v-if 隐藏
 * - 权限列表优先取用户 unique，其次取当前路由 meta.authList
 *
 * @module directives/auth
 * @author Art Design Pro Team
 */

import { App, Directive, DirectiveBinding } from 'vue'
import { checkAuth } from '@/hooks/core/useAuth'

export type AuthDirective = Directive<HTMLElement, string>

function checkAuthPermission(el: HTMLElement, binding: DirectiveBinding<string>): void {
  // 未绑定权限码时不限制（便于 v-for 中按需传 auth）
  if (!binding.value) return
  if (checkAuth(binding.value)) return
  removeElement(el)
}

function removeElement(el: HTMLElement): void {
  if (el.parentNode) {
    el.parentNode.removeChild(el)
  }
}

const authDirective: AuthDirective = {
  mounted: checkAuthPermission,
  updated: checkAuthPermission
}

export function setupAuthDirective(app: App): void {
  app.directive('auth', authDirective)
}
