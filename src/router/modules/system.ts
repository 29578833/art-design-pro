/*
 * @Descripttion:
 * @Author: wy
 * @Date: 2026-07-06 12:14:19
 * @LastEditors: NUMBER\29758
 * @LastEditTime: 2026-07-13 17:06:45
 */
import { AppRouteRecord } from '@/types/router'

export const systemRoutes: AppRouteRecord = {
  path: '/system',
  name: 'System',
  component: '/index/index',
  meta: {
    title: 'menus.system.title',
    icon: 'ri:user-3-line',
    menuId: 12
  },
  children: [
    {
      path: 'user',
      name: 'User',
      component: '/system/user',
      meta: {
        title: 'menus.system.user',
        keepAlive: true,
        menuId: 20
      }
    },
    {
      path: 'role',
      name: 'Role',
      component: '/system/role',
      meta: {
        title: 'menus.system.role',
        keepAlive: true,
        menuId: 19
      }
    },
    {
      path: 'miniprogram',
      name: 'Miniprogram',
      component: '/system/miniprogram',
      meta: {
        title: 'menus.system.miniprogram',
        keepAlive: true,
        menuId: 3465
      }
    },
    {
      path: 'dict',
      name: 'SystemDict',
      component: '/system/dict',
      meta: {
        title: 'menus.system.dict',
        keepAlive: true,
        menuId: 3430
      }
    },
    {
      path: 'user-center',
      name: 'UserCenter',
      component: '/system/user-center',
      meta: {
        title: 'menus.system.userCenter',
        isHide: true,
        keepAlive: true,
        isHideTab: true
      }
    },
    {
      path: 'menu',
      name: 'Menus',
      component: '/system/menu',
      meta: {
        title: 'menus.system.menu',
        keepAlive: true,
        isHide: true,
        authList: [
          { title: '新增', authMark: 'add' },
          { title: '编辑', authMark: 'edit' },
          { title: '删除', authMark: 'delete' }
        ]
      }
    }
  ]
}
