# ERP 后台参考文档

## 项目背景

- **产品**：鑫广智能回收 / 汽拆回收拆解管理系统
- **Figma 原型**：[正式C+演示 汽拆+回收小程序设计202606](https://www.figma.com/design/gTO569hs06qVOGzJzY9DeI)
- **原型代码目录**：`回收拆车项目/`（Figma Make 导出，React 可交互原型）
- **实现目标**：`art-design-pro` ERP 后台（Vue 3 + Element Plus）
- **后端（规划）**：Spring Boot 3.x + MyBatis-Plus + PostgreSQL + Redis

## 七大业务域菜单结构

来自 `AdminDashboard.tsx` → 迁移为 Vue 侧边栏菜单：

### 数据看板

| 菜单     | moduleId  | 原型组件          |
| -------- | --------- | ----------------- |
| 数据看板 | dashboard | DataDashboard.tsx |

### ① 回收业务域

| 菜单           | moduleId        | 原型组件                                         |
| -------------- | --------------- | ------------------------------------------------ |
| 客户供应商管理 | customers       | CustomerManagement.tsx                           |
| 订单管理       | orders          | OrderManagementAdmin.tsx                         |
| 订单审核       | order-audit     | OrderManagementAdmin (defaultTab=pending_review) |
| 线索订单       | order-lead      | OrderManagementAdmin (defaultTab=lead)           |
| 附件签名       | order-signature | OrderSignature.tsx                               |
| 车辆档案       | vehicles        | VehicleManagement.tsx                            |
| 商务部对接     | certificates    | CertificateManagement.tsx                        |

### ② 厂区运营域

| 菜单     | moduleId    | 原型组件                                      |
| -------- | ----------- | --------------------------------------------- |
| 质检管理 | quality     | QualityControl.tsx                            |
| 车辆入厂 | ve-entry    | VehicleEntryManagement (defaultView=entry)    |
| 库位管理 | ve-location | VehicleEntryManagement (defaultView=location) |

### ③ 拆解生产域

| 菜单     | moduleId    | 原型组件                  |
| -------- | ----------- | ------------------------- |
| 领料管理 | pickup      | PickupManagement.tsx      |
| 拆解管理 | dismantling | DismantlingManagement.tsx |
| 产物入库 | production  | ProductionManagement.tsx  |

### ④ 仓储销售域

| 菜单     | moduleId     | 原型组件                                   |
| -------- | ------------ | ------------------------------------------ |
| 库存管理 | inv-stock    | InventoryManagement (defaultTab=inventory) |
| 销售出库 | inv-outbound | InventoryManagement (defaultTab=outbound)  |

### ⑤ 财务结算域

| 菜单       | moduleId     | 原型组件                                          |
| ---------- | ------------ | ------------------------------------------------- |
| 结算列表   | set-list     | SettlementManagement (defaultTab=list)            |
| 付款流水   | set-payment  | SettlementManagement (defaultTab=payment_records) |
| 业务员统计 | set-salesman | SettlementManagement (defaultTab=salesman_stats)  |

### ⑥ 数据决策域

| 菜单     | moduleId    | 原型组件                            |
| -------- | ----------- | ----------------------------------- |
| 数据看板 | dashboard   | DataDashboard.tsx                   |
| 报表中心 | rpt-reports | ReportsCenter (defaultView=reports) |
| 趋势分析 | rpt-trends  | ReportsCenter (defaultView=trends)  |

### ⑦ 系统基础域

| 菜单       | moduleId    | 原型组件                                 |
| ---------- | ----------- | ---------------------------------------- |
| 用户账号   | sys-users   | SystemConfiguration (defaultPage=users)  |
| 角色权限   | sys-roles   | SystemConfiguration (defaultPage=roles)  |
| 数据字典   | sys-dict    | SystemConfiguration (defaultPage=dict)   |
| 价格配置   | sys-price   | SystemConfiguration (defaultPage=price)  |
| 操作日志   | sys-logs    | SystemConfiguration (defaultPage=logs)   |
| 系统通知   | sys-notify  | SystemConfiguration (defaultPage=notify) |
| 小程序管理 | miniprogram | MiniprogramManagement.tsx                |

## 弹窗与子组件

| 组件                       | 用途                     |
| -------------------------- | ------------------------ |
| CreateOrderWizard.tsx      | 创建订单向导（多步表单） |
| CreateOrderModal.tsx       | 快速创建订单弹窗         |
| OrderDetailModal.tsx       | 客户订单详情             |
| FormalOrderDetailModal.tsx | 正式回收订单详情         |
| LeadDetailModal.tsx        | 线索订单详情             |
| TowingOrderDetailModal.tsx | 拖车订单详情             |
| VehicleDetailModal.tsx     | 车辆档案详情             |
| CreateVehicleModal.tsx     | 新建车辆弹窗             |

## 订单类型与状态机

源文件：`回收拆车项目/src/app/types/order.ts`

### 订单类型 (OrderType)

- `lead` — 线索订单（子类型：vehicle 车辆线索 / customer 客户线索）
- `customer` — 客户申请报废收车订单
- `staff` — 员工申请报废收车订单（正式订单）
- `towing` — 拖车订单

### 商流状态（回收订单，4 种）

- `pending_review` 待审核
- `approved` 审核通过
- `rejected` 审核驳回
- `completed` 已完成

### 物流状态（车辆/正式订单）

- `pending_entry` 待入厂
- `towing_pending` 拖车待接单
- `towing` 拖车中
- `towing_completed` 拖车完成
- `inspecting` 入厂查验中
- `dismantling` 拆解中
- `canceling` 注销中
- `canceled` 已注销
- `completed` 已完成

### 拖车状态

- `pending_dispatch` 待派单
- `pending_towing` 待拖车
- `towing` 拖车中
- `completed` 已完成

### 结算类型/方式

- SettlementType: `personal` | `corporate`
- SettlementMethod: `weight` | `curb_weight` | `whole_vehicle`

## 订单管理核心功能（P0 重点）

`OrderManagementAdmin.tsx` 包含：

**主 Tab**

- 全部 / 线索订单 / 正式回收订单 / 拖车单 / 待审核

**筛选维度**

- 正式订单：来源(customer/staff)、商流状态、签名状态、单台/批量
- 线索：跟进状态、线索类型(vehicle/customer)
- 拖车：派单/拖车/完成状态

**操作**

- 创建订单（向导）
- 审核（单条/批量，含结算信息、质检豁免、签名）
- 查看详情（按订单类型打开不同 Modal）
- 导出

## PRD 文档索引

| 文档 | 路径 | 用途 |
| --- | --- | --- |
| 完整 PRD（含管理后台第四章） | `回收拆车项目/src/imports/___KZ__-___________PRD_______1_.md` | 后台功能设计权威来源 |
| 订单管理模块 V6 | `回收拆车项目/src/imports/V6____-__________-1.md` | 订单状态流转、角色协作 |
| 小程序 PRD v2 | `回收拆车项目/鑫广智能回收小程序_完整PRD需求文档_v2.md` | 仅参考字段/状态，不做页面 |
| 收车规则 | `回收拆车项目/src/imports/pasted_text/vehicle-acquisition-rules.md` | 业务规则 |
| 泳道图需求池 | `回收拆车项目/src/imports/【0429泳道图+需求池】*.md` | 一期需求范围 |

## art-design-pro 集成清单

新建 ERP 模块时按此清单操作：

### 1. 路由模块 `src/router/modules/recycle.ts`

```ts
import { AppRouteRecord } from '@/types/router'

export const recycleRoutes: AppRouteRecord = {
  path: '/recycle',
  name: 'Recycle',
  component: '/index/index',
  meta: {
    title: 'menus.recycle.title',
    icon: 'ri:recycle-line',
    roles: ['R_SUPER', 'R_ADMIN']
  },
  children: [
    {
      path: 'orders',
      name: 'RecycleOrders',
      component: '/recycle/recovery/orders',
      meta: { title: 'menus.recycle.orders', keepAlive: true }
    }
    // ... 其他子路由
  ]
}
```

### 2. 注册路由

`src/router/modules/index.ts` 添加 `recycleRoutes`。

### 3. i18n

`src/locales/langs/zh.json`:

```json
{
  "menus": {
    "recycle": {
      "title": "回收管理",
      "orders": "订单管理",
      "vehicles": "车辆档案"
    }
  }
}
```

### 4. API 层

```
src/api/recycle/
├── order.ts      # 订单 CRUD、审核、导出
├── vehicle.ts    # 车辆档案
├── customer.ts   # 客户供应商
├── quality.ts    # 质检
├── inventory.ts  # 库存
└── settlement.ts # 结算
```

### 5. 类型层

```
src/types/recycle/
├── order.ts      # 从原型 order.ts 迁移并适配 Api 命名空间
├── vehicle.ts
└── index.ts
```

## 后端接口规划（PRD 提及 10 API）

域间通过 API 通信，前端按域拆分请求模块：

1. 回收订单 API — 订单 CRUD、审核、状态流转
2. 车辆管理 API — 车辆档案、物流状态
3. 拖车调度 API — 派单、接单、完成
4. 质检 API — 入厂查验
5. 拆解生产 API — 领料、拆解、产物
6. 库存 API — 入库、出库、台账
7. 结算 API — 结算单、付款流水
8. 客户 API — 客户/供应商档案
9. 商务部 API — 回收证明对接（车信盟）
10. 系统 API — 字典、价格、通知

接口未就绪时，页面内 Mock 数据结构与 `order.ts` 保持一致，便于后续替换。

## 分期实施明细

### Phase 1 (P0) — 6~8 周

- [ ] 路由骨架 + 七大域菜单
- [ ] 数据看板 DataDashboard
- [ ] 订单管理 OrderManagementAdmin（含审核工作台）
- [ ] 线索订单
- [ ] 客户供应商管理
- [ ] 车辆档案
- [ ] 附件签名
- [ ] 类型定义 + API 层骨架

### Phase 2 (P1)

- [ ] 质检管理
- [ ] 车辆入厂 + 库位管理
- [ ] 领料 / 拆解 / 产物入库

### Phase 3 (P2)

- [ ] 库存管理 + 销售出库
- [ ] 结算列表 + 付款流水 + 业务员统计

### Phase 4 (P3)

- [ ] 报表中心 + 趋势分析
- [ ] 商务部对接
- [ ] 系统扩展（价格配置、小程序管理）

## 原型运行方式

```bash
cd 回收拆车项目
pnpm i
pnpm dev
```

登录路径：系统选择 → ERP管理后台 → LoginPage → AdminDashboard
