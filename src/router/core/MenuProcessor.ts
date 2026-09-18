/**
 * 菜单处理器
 *
 * 负责菜单数据的获取、过滤和处理
 *
 * @module router/core/MenuProcessor
 * @author Art Design Pro Team
 */

import type { AppRouteRecord } from '@/types/router'
import { useUserStore } from '@/store/modules/user'
import { collectMenuIds, fetchGetMenus } from '@/api/auth'
import { asyncRoutes } from '../routes/asyncRoutes'
import { formatMenuTitle } from '@/utils'

export class MenuProcessor {
  /**
   * 获取菜单数据
   */
  async getMenuList(): Promise<AppRouteRecord[]> {
    const menuList = await this.processPermissionMenus()

    // 在规范化路径之前，验证原始路径配置
    this.validateMenuPaths(menuList)

    // 规范化路径（将相对路径转换为完整路径）
    return this.normalizeMenuPaths(menuList)
  }

  /**
   * 调用 /menus 获取当前角色可见菜单，再按 menuId 过滤本地路由
   */
  private async processPermissionMenus(): Promise<AppRouteRecord[]> {
    const res = await fetchGetMenus()
    const backendMenus = res?.menus || []
    const menuIds = collectMenuIds(backendMenus).filter((id) => !Number.isNaN(id) && id > 0)

    this.syncUserMenuAuth(menuIds, res.unique)

    const allowedIds = new Set(menuIds)
    const menuList = this.filterMenuByIds([...asyncRoutes], allowedIds)
    return this.filterEmptyMenus(menuList)
  }

  /** 把 /menus 返回的菜单 id、权限标识写回用户信息，供按钮权限使用 */
  private syncUserMenuAuth(menuIds: number[], unique?: string[]) {
    const userStore = useUserStore()
    userStore.setUserInfo({
      ...userStore.info,
      menuIds,
      buttons: unique || []
    } as Api.Auth.UserInfo)
  }

  /**
   * 根据后端 menuId 过滤菜单
   */
  private filterMenuByIds(menu: AppRouteRecord[], allowedIds: Set<number>): AppRouteRecord[] {
    return menu.reduce((acc: AppRouteRecord[], item) => {
      const children = item.children?.length
        ? this.filterMenuByIds(item.children, allowedIds)
        : undefined

      const menuId = item.meta?.menuId
      const hasMenuId = menuId != null
      const selfAllowed = hasMenuId && allowedIds.has(Number(menuId))
      const hasVisibleChildren = Boolean(children?.some((child) => !child.meta?.isHide))

      // 隐藏路由、全屏异常页等无 menuId 的叶子节点仍注册
      if (!hasMenuId && !item.children?.length) {
        if (item.meta?.isHide || item.meta?.isFullPage || item.meta?.isHideTab) {
          acc.push(item)
        }
        return acc
      }

      // 父级保留条件：
      // 1. 自身有权限；或
      // 2. 存在非隐藏子节点（真正显示在菜单里）；或
      // 3. 无 menuId 的目录型父级（如异常页容器）只要有被保留的子节点即可（用于注册隐藏页）
      const hasAnyChildren = Boolean(children?.length)
      if (selfAllowed || hasVisibleChildren || (!hasMenuId && hasAnyChildren)) {
        acc.push({ ...item, children })
      }

      return acc
    }, [])
  }

  /**
   * 根据角色过滤菜单
   */
  private filterMenuByRoles(menu: AppRouteRecord[], roles: string[]): AppRouteRecord[] {
    return menu.reduce((acc: AppRouteRecord[], item) => {
      const itemRoles = item.meta?.roles
      const hasPermission = !itemRoles || itemRoles.some((role) => roles?.includes(role))

      if (hasPermission) {
        const filteredItem = { ...item }
        if (filteredItem.children?.length) {
          filteredItem.children = this.filterMenuByRoles(filteredItem.children, roles)
        }
        acc.push(filteredItem)
      }

      return acc
    }, [])
  }

  /**
   * 递归过滤空菜单项
   */
  private filterEmptyMenus(menuList: AppRouteRecord[]): AppRouteRecord[] {
    return menuList
      .map((item) => {
        // 如果有子菜单，先递归过滤子菜单
        if (item.children && item.children.length > 0) {
          const filteredChildren = this.filterEmptyMenus(item.children)
          return {
            ...item,
            children: filteredChildren
          }
        }
        return item
      })
      .filter((item) => {
        // 目录菜单：有可见子项则保留
        if (item.children?.length) {
          return true
        }

        // 无子菜单时，自身可导航的入口仍保留（如尚未挂子页的业务域占位菜单）
        if (this.isNavigableRoute(item)) {
          return true
        }

        // 外链 / iframe
        if (item.meta?.isIframe === true || item.meta?.link) {
          return true
        }

        return false
      })
  }

  /**
   * 验证菜单列表是否有效
   */
  validateMenuList(menuList: AppRouteRecord[]): boolean {
    return Array.isArray(menuList) && menuList.length > 0
  }

  /**
   * 规范化菜单路径
   * 将相对路径转换为完整路径，确保菜单跳转正确
   */
  private normalizeMenuPaths(menuList: AppRouteRecord[], parentPath = ''): AppRouteRecord[] {
    return menuList.map((item) => {
      // 构建完整路径
      const fullPath = this.buildFullPath(item.path || '', parentPath)

      // 递归处理子菜单
      const children = item.children?.length
        ? this.normalizeMenuPaths(item.children, fullPath)
        : item.children

      const redirect = item.redirect || this.resolveDefaultRedirect(children)

      return {
        ...item,
        path: fullPath,
        redirect,
        children
      }
    })
  }

  /**
   * 为目录型菜单推导默认跳转地址
   */
  private resolveDefaultRedirect(children?: AppRouteRecord[]): string | undefined {
    if (!children?.length) {
      return undefined
    }

    for (const child of children) {
      if (this.isNavigableRoute(child)) {
        return child.path
      }

      const nestedRedirect = this.resolveDefaultRedirect(child.children)
      if (nestedRedirect) {
        return nestedRedirect
      }
    }

    return undefined
  }

  /**
   * 判断子路由是否可以作为默认落点
   */
  private isNavigableRoute(route: AppRouteRecord): boolean {
    return Boolean(
      route.path &&
        route.path !== '/' &&
        !route.meta?.link &&
        route.meta?.isIframe !== true &&
        route.component &&
        route.component !== ''
    )
  }

  /**
   * 验证菜单路径配置
   * 检测非一级菜单是否错误使用了 / 开头的路径
   */
  /**
   * 验证菜单路径配置
   * 检测非一级菜单是否错误使用了 / 开头的路径
   */
  private validateMenuPaths(menuList: AppRouteRecord[], level = 1): void {
    menuList.forEach((route) => {
      if (!route.children?.length) return

      const parentName = String(route.name || route.path || '未知路由')

      route.children.forEach((child) => {
        const childPath = child.path || ''

        // 跳过合法的绝对路径：外部链接和 iframe 路由
        if (this.isValidAbsolutePath(childPath)) return

        // 检测非法的绝对路径
        if (childPath.startsWith('/')) {
          this.logPathError(child, childPath, parentName, level)
        }
      })

      // 递归检查更深层级的子路由
      this.validateMenuPaths(route.children, level + 1)
    })
  }

  /**
   * 判断是否为合法的绝对路径
   */
  private isValidAbsolutePath(path: string): boolean {
    return (
      path.startsWith('http://') ||
      path.startsWith('https://') ||
      path.startsWith('/outside/iframe/')
    )
  }

  /**
   * 输出路径配置错误日志
   */
  private logPathError(
    route: AppRouteRecord,
    path: string,
    parentName: string,
    level: number
  ): void {
    const routeName = String(route.name || path || '未知路由')
    const menuTitle = route.meta?.title || routeName
    const suggestedPath = path.split('/').pop() || path.slice(1)

    console.error(
      `[路由配置错误] 菜单 "${formatMenuTitle(menuTitle)}" (name: ${routeName}, path: ${path}) 配置错误\n` +
        `  位置: ${parentName} > ${routeName}\n` +
        `  问题: ${level + 1}级菜单的 path 不能以 / 开头\n` +
        `  当前配置: path: '${path}'\n` +
        `  应该改为: path: '${suggestedPath}'`
    )
  }

  /**
   * 构建完整路径
   */
  private buildFullPath(path: string, parentPath: string): string {
    if (!path) return ''

    // 外部链接直接返回
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path
    }

    // 如果已经是绝对路径，直接返回
    if (path.startsWith('/')) {
      return path
    }

    // 拼接父路径和当前路径
    if (parentPath) {
      // 移除父路径末尾的斜杠，移除子路径开头的斜杠，然后拼接
      const cleanParent = parentPath.replace(/\/$/, '')
      const cleanChild = path.replace(/^\//, '')
      return `${cleanParent}/${cleanChild}`
    }

    // 没有父路径，添加前导斜杠
    return `/${path}`
  }
}
