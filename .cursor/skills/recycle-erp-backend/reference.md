# ERP 后台参考文档

## 项目背景

- **产品**：鑫广智能回收 / 汽拆回收拆解管理系统
- **Figma 原型**：[正式C+演示 汽拆+回收小程序设计202606](https://www.figma.com/design/gTO569hs06qVOGzJzY9DeI)（本地导出包：`汽拆+回收小程序设计20260716`）
- **原型代码目录**：`C:\Users\29758\Downloads\汽拆+回收小程序设计20260716`（Figma Make 导出，React 可交互原型；下文简称 `回收拆车项目/`）
- **最新 PC UI 规范**：`回收拆车项目/鑫广管理后台_UI设计规范文档_v1.md`
- **实现目标**：`art-design-pro` ERP 后台（Vue 3 + Element Plus，当前工作区）
- **后端接口**：`D:\ROOT\QXB\xinguang-api\xinguang_api` / `scrap` 管理后台接口（下文简称 `xinguang_api/`；对接详见 `xinguang-api-integration` skill）

## 最新 PC 菜单结构

来自 `鑫广管理后台_UI设计规范文档_v1.md`。新做页面按 11 个一级菜单理解业务边界；落到 `art-design-pro` 时可继续复用现有 `views/recycle/` 目录分域，不为了菜单命名改动做无关重构。

### 一级菜单

| 菜单ID       | 显示名称   | 原型组件                                                        |
| ------------ | ---------- | --------------------------------------------------------------- |
| dashboard    | 首页       | DataDashboard.tsx                                               |
| orders       | 订单管理   | OrderManagementAdmin.tsx                                        |
| vehicles     | 车辆信息   | VehicleManagement.tsx / VehicleDetailModal.tsx                  |
| certificates | 办证管理   | CertificateManagement.tsx                                       |
| quality      | 质检管理   | QualityControl.tsx                                              |
| inventory    | 库存管理   | InventoryManagement.tsx                                         |
| dismantling  | 拆解管理   | DismantlingManagement.tsx                                       |
| production   | 生产管理   | ProductionManagement.tsx                                        |
| settlement   | 结算管理   | SettlementManagement.tsx                                        |
| miniprogram  | 小程序管理 | MiniprogramManagement.tsx（仅后台管理配置，不迁移小程序端页面） |
| system       | 系统配置   | SystemConfiguration.tsx                                         |

### 二级菜单速查

| 父模块 | 二级菜单ID | 显示名称 |
| --- | --- | --- |
| 订单管理 | order-list / order-create / order-audit / order-dispatch | 订单列表 / 手动创建订单 / 订单审核 / 派单管理 |
| 车辆信息 | vehicle-list / vehicle-archive / vehicle-doc-audit / vehicle-trace | 车辆列表 / 车辆档案 / 资料审核 / 全流程追溯 |
| 办证管理 | cert-pending / cert-cxm / cert-recovery / cert-cancel | 待注销车辆 / 商委对接 / 回收证明 / 注销证明 |
| 质检管理 | qc-pending / qc-entry / qc-inspection / qc-report | 待检车辆 / 入场信息 / 缺件查验 / 质检报告 |
| 库存管理 | stock-in / stock-out / stock-list / stock-stat | 车辆入库 / 车辆出库 / 库存清单 / 库存统计 |
| 拆解管理 | disasm-pending / disasm-dispatch / disasm-exec / disasm-output | 待拆解车辆 / 拆解派工 / 拆解执行 / 产出登记 |
| 结算管理 | set-list / set-payment / set-salesman | 结算列表 / 付款流水 / 业务员统计 |

## 弹窗与子组件

Vue 实现规范（布局还原原型 + Element Plus 控件）见 [SKILL.md 弹窗布局规范](SKILL.md#弹窗布局规范还原原型--本项目组件)。

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
| OrderSignature.tsx         | 待签附件/订单签署工作台  |

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

**正式订单详情**

- 基本信息：客户、车辆、托运、结算、代理人、收款银行卡
- 流程/日志：流程总览、状态变更、操作记录合并展示
- 附件与签署：签名进度、待签/已签状态、单个签名、一键批量签名、签名模板管理
- 批量回收：订单商流状态与每台车物流状态分开；详情中切换车辆只影响车辆信息与物流状态展示

## PRD 文档索引

| 文档 | 路径 | 用途 |
| --- | --- | --- |
| 全端完整 PRD v4.2（最新） | `回收拆车项目/docs/鑫广智能回收系统_全端完整PRD_v4.2.md` | 全端需求总览；管理后台见第四章 |
| PC UI 设计规范 v1 | `回收拆车项目/鑫广管理后台_UI设计规范文档_v1.md` | 视觉、布局、颜色、表格、弹窗权威来源 |
| PC 订单管理字段更新 v4.5 | `回收拆车项目/src/imports/_v3-PC_-_________-______.md` | 订单结算字段、审核弹窗、附件清单最新要求 |
| PC 订单/车辆核心模块 v4.0 | `回收拆车项目/src/imports/_v2-PC_-____-____.md` | 订单管理、车辆管理、待审核工作台 |
| PC 订单/车辆基础 PRD | `回收拆车项目/src/imports/_V1-PC_-__________260605.md` | V12/V13 汇总后的 PC 端需求 |
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
cd "C:/Users/29758/Downloads/汽拆+回收小程序设计20260716"    # 原型代码目录（上文简称 `回收拆车项目/`）
pnpm i
pnpm dev
```

登录路径：系统选择 → ERP管理后台 → LoginPage → AdminDashboard
