import { AppRouteRecord } from '@/types/router'

/** 回收业务域 */
export const recycleRecoveryRoutes: AppRouteRecord = {
  path: '/recycle/recovery',
  name: 'RecycleRecovery',
  component: '/index/index',
  meta: {
    title: 'menus.recycle.recovery',
    icon: 'ri:recycle-line',
    menuId: 3473
  },
  children: [
    {
      path: 'customers',
      name: 'RecycleCustomers',
      component: '/recycle/customers',
      meta: {
        title: 'menus.recycle.customers',
        keepAlive: true,
        menuId: 3545
      }
    },
    {
      path: 'orders',
      name: 'RecycleOrders',
      component: '/recycle/recovery/orders',
      meta: {
        title: 'menus.recycle.orders',
        keepAlive: true,
        menuId: 3546
      }
    },
    {
      path: 'orders/audit',
      name: 'RecycleOrderAudit',
      component: '/recycle/recovery/orders/audit',
      meta: {
        title: 'menus.recycle.orderAudit',
        keepAlive: true,
        menuId: 3502
      }
    },
    {
      path: 'orders/lead',
      name: 'RecycleOrderLead',
      component: '/recycle/recovery/orders/lead',
      meta: {
        title: 'menus.recycle.orderLead',
        keepAlive: true,
        menuId: 3501
      }
    },
    {
      path: 'orders/sign',
      name: 'RecycleOrderSign',
      component: '/recycle/recovery/orders/sign',
      meta: {
        title: 'menus.recycle.orderSign',
        keepAlive: true,
        menuId: 3503
      }
    },
    {
      path: 'vehicles',
      name: 'RecycleVehicles',
      component: '/recycle/recovery/vehicles',
      meta: {
        title: 'menus.recycle.vehicles',
        keepAlive: true,
        menuId: 3518
      }
    }
  ]
}

/** 厂区运营域 */
export const recycleFactoryRoutes: AppRouteRecord = {
  path: '/recycle/factory',
  name: 'RecycleFactory',
  component: '/index/index',
  meta: {
    title: 'menus.recycle.factory',
    icon: 'ri:building-2-line',
    menuId: 3494
  },
  children: []
}

/** 拆解生产域 */
export const recycleDismantleRoutes: AppRouteRecord = {
  path: '/recycle/dismantle',
  name: 'RecycleDismantle',
  component: '/index/index',
  meta: {
    title: 'menus.recycle.dismantle',
    icon: 'ri:tools-line',
    menuId: 3496
  },
  children: []
}

/** 仓储销售域 */
export const recycleWarehouseRoutes: AppRouteRecord = {
  path: '/recycle/warehouse',
  name: 'RecycleWarehouse',
  component: '/index/index',
  meta: {
    title: 'menus.recycle.warehouse',
    icon: 'ri:store-2-line',
    menuId: 3495
  },
  children: []
}

/** 财务结算域 */
export const recycleFinanceRoutes: AppRouteRecord = {
  path: '/recycle/finance',
  name: 'RecycleFinance',
  component: '/index/index',
  meta: {
    title: 'menus.recycle.finance',
    icon: 'ri:money-cny-circle-line',
    menuId: 3485
  },
  children: []
}

/** 数据决策域 */
export const recycleDecisionRoutes: AppRouteRecord = {
  path: '/recycle/decision',
  name: 'RecycleDecision',
  component: '/index/index',
  meta: {
    title: 'menus.recycle.decision',
    icon: 'ri:bar-chart-box-line',
    menuId: 3476
  },
  children: []
}

/** 车信盟域 */
export const recycleCxmRoutes: AppRouteRecord = {
  path: '/recycle/cxm',
  name: 'RecycleCxm',
  component: '/index/index',
  meta: {
    title: 'menus.recycle.cxm',
    icon: 'ri:car-line',
    menuId: 3542
  },
  children: []
}

/** 回收模块全部路由 */
export const recycleRoutes: AppRouteRecord[] = [
  recycleRecoveryRoutes,
  recycleFactoryRoutes,
  recycleDismantleRoutes,
  recycleWarehouseRoutes,
  recycleFinanceRoutes,
  recycleDecisionRoutes,
  recycleCxmRoutes
]
