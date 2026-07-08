---
name: recycle-erp-backend
description: >-
  在 art-design-pro 中实现鑫广汽拆回收 ERP 管理后台（仅 PC 后台，不含小程序）。 将 回收拆车项目 Figma 原型迁移为 Vue 3 + Element Plus 页面。 适用于用户提及回收拆车、汽拆、ERP 后台、订单管理、车辆档案、拆解生产、 仓储销售、财务结算、管理后台七大业务域等开发任务。
---

# 鑫广汽拆回收 ERP 后台开发

## 范围约束（必须遵守）

- **只做 ERP 管理后台**，忽略小程序端全部页面与角色（owner/staff/reviewer/admin/driver）
- **目标项目**：`art-design-pro`（Vue 3 + Element Plus + Pinia + Vue Router）
- **原型参考**：`回收拆车项目/`（React + shadcn，仅作 UI/交互/字段参考，不直接复制）
- **不处理格式化**：不做无关 prettier/stylelint 调整

## 开发前必读

1. 读原型对应 admin 组件，理解页面结构、Tab、弹窗、筛选字段
2. 读 `回收拆车项目/src/app/types/order.ts` 获取订单/车辆状态枚举（**仅作业务参考，列表类型字段以 xinguang_api 接口为准**）
3. 读 PRD 第四章：`回收拆车项目/src/imports/___KZ__-___________PRD_______1_.md`（管理后台功能设计）
4. 对照 art-design-pro 现有页面惯例（如 `src/views/system/user/index.vue`）

详细模块映射、分期计划、目录结构见 [reference.md](reference.md)。

## 核心业务架构（三域解耦）

实现时必须分开建模，**禁止把商流状态与物流状态混在一个字段**：

| 域                    | 标识           | 状态示例                        |
| --------------------- | -------------- | ------------------------------- |
| 回收订单（商流）      | 回收订单号     | 待审核 → 审核通过/驳回 → 已完成 |
| 车辆管理（物流/资产） | 车辆订单号/VIN | 拖车 → 入厂 → 拆解 → 注销       |
| 库存管理（后市场）    | 库存物品ID     | 产物入库 → 库存 → 销售出库      |

关键规则：切换批次车辆查看时，**回收订单商流状态不随车辆物流状态变化**。

## 技术迁移规范

### 框架对照

| 原型 (React)        | 目标 (Vue)                        |
| ------------------- | --------------------------------- |
| useState            | ref / reactive                    |
| shadcn Dialog/Table | ElDialog / ArtTable               |
| lucide-react        | @iconify/vue 或 Element Plus 图标 |
| 内联 Mock 数组      | `src/api/recycle/` + Pinia store  |
| AdminDashboard 路由 | `src/router/modules/recycle.ts`   |

### 页面模板（遵循现有惯例）

```vue
<template>
  <div class="xxx-page art-full-height">
    <XxxSearch v-model="searchForm" @search="handleSearch" @reset="resetSearchParams" />
    <ElCard class="art-table-card">
      <ArtTableHeader v-model:columns="columnChecks" :loading="loading" @refresh="refreshData">
        <template #left><!-- 操作按钮 --></template>
      </ArtTableHeader>
      <ArtTable :loading="loading" :data="data" :columns="columns" :pagination="pagination" />
    </ElCard>
  </div>
</template>
```

- 列表页用 `useTable`（`src/hooks/core/useTable.ts`）
- 分页适配用 `src/utils/table/tableUtils.ts`
- 弹窗拆到 `modules/xxx-dialog.vue`
- 搜索拆到 `modules/xxx-search.vue`

### 目录约定

```
src/
├── api/recycle/          # 按业务域拆分 API
├── types/recycle/        # 订单、车辆、库存类型（接口 snake_case 原字段 + 中文备注）
├── store/modules/recycle/  # Pinia（按需）
├── router/modules/recycle.ts
└── views/recycle/
    ├── dashboard/
    ├── recovery/         # 回收业务域
    ├── factory/          # 厂区运营域
    ├── dismantling/      # 拆解生产域
    ├── warehouse/        # 仓储销售域
    ├── finance/          # 财务结算域
    ├── analytics/        # 数据决策域
    └── system/           # 系统扩展（价格/字典等）
```

### 路由注册

在 `src/router/modules/index.ts` 中导入 `recycleRoutes`。路由 meta 参考 `dashboard.ts` / `system.ts`：`title`、`icon`、`roles`、`keepAlive`。

### i18n

菜单文案加到 `src/locales/langs/zh.json`（及 en.json），路由 meta.title 用 `menus.recycle.xxx`。

## 单模块开发流程

```
1. 确认模块 → 查 reference.md 找到原型组件
2. 定义 types → src/types/recycle/（接口 snake_case 原字段 + 中文备注）
3. 创建 API 接口（可先 Mock，对接后列表直接返回 res.list）→ src/api/recycle/
4. 创建路由 → src/router/modules/recycle.ts
5. 实现页面 index.vue + modules/（表格直接读接口字段）
6. 复杂弹窗/向导单独组件
7. 自测：列表筛选、分页、详情弹窗、状态标签颜色
```

### 列表项字段规范（必须遵守）

**列表项字段映射不要搞什么映射，直接用接口字段，不要映射 mock 字段！！！**

- `src/types/recycle/`：列表项 interface 与后端出参字段名一致（snake_case），**每个字段写中文备注**
- `src/api/recycle/`：`fetchXxxList` 禁止 `mapXxxItem`，直接 `return res.list`
- 页面表格：`prop` / `formatter` / 操作列用 `real_name`、`order_no`、`status` 等接口字段，禁止沿用原型 mock 的 camelCase 字段名
- 原型 `order.ts` 仅参考状态/交互，**不得**把其字段名当作前端列表类型

接口对接细则见 [xinguang-api-integration](../xinguang-api-integration/SKILL.md)。

## 状态与标签

从 `order.ts` 迁移 `STATUS_TEXT`、`STATUS_COLOR`、`ORDER_TYPE_CONFIG`，在 Vue 中用 `ElTag` 渲染：

- 线索：橙色系 `#FA8C16`
- 客户订单：紫色 `#722ED1`
- 员工订单：蓝色 `#1890FF`
- 拖车单：青色 `#13C2C2`

## 分期优先级

| 阶段 | 模块                  | 说明                             |
| ---- | --------------------- | -------------------------------- |
| P0   | 数据看板 + 回收业务域 | 订单/审核/线索/车辆档案/客户管理 |
| P1   | 厂区运营 + 拆解生产   | 质检、入厂、领料、拆解、产物入库 |
| P2   | 仓储销售 + 财务结算   | 库存、出库、结算、付款流水       |
| P3   | 数据决策 + 系统扩展   | 报表、趋势、价格配置、小程序管理 |

用户未指定时，默认按 P0 → P1 顺序推进。

## 禁止事项

- 不要把小程序页面迁入 art-design-pro
- 不要新建独立 React 子项目
- 不要照搬 shadcn 组件，统一用 Element Plus + 项目已有 Art 组件
- **列表项不要搞字段映射，直接用接口字段，不要映射 mock 字段**
- 不要大范围重构无关模块
- 不要擅自 git commit（除非用户明确要求）

## 快速定位原型

| 需求 | 原型文件 |
| --- | --- |
| 订单管理/审核/线索 | `回收拆车项目/src/app/components/admin/OrderManagementAdmin.tsx` |
| 数据看板 | `admin/DataDashboard.tsx` |
| 车辆档案 | `admin/VehicleManagement.tsx` |
| 客户管理 | `admin/CustomerManagement.tsx` |
| 商务部对接 | `admin/CertificateManagement.tsx` |
| 质检/入厂 | `admin/QualityControl.tsx`, `admin/VehicleEntryManagement.tsx` |
| 拆解生产 | `admin/PickupManagement.tsx`, `admin/DismantlingManagement.tsx`, `admin/ProductionManagement.tsx` |
| 仓储/结算/报表 | `admin/InventoryManagement.tsx`, `admin/SettlementManagement.tsx`, `admin/ReportsCenter.tsx` |
| 系统配置 | `admin/SystemConfiguration.tsx` |
| 侧边栏布局参考 | `admin/AdminDashboard.tsx`（仅参考菜单结构） |

完整映射表见 [reference.md](reference.md)。
