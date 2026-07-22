---
name: recycle-erp-backend
description: >-
  在 art-design-pro 中实现鑫广汽拆回收 ERP 管理后台（仅 PC 后台，不含小程序）。 将 回收拆车项目 Figma 原型迁移为 Vue 3 + Element Plus 页面。 适用于用户提及回收拆车、汽拆、ERP 后台、订单管理、车辆档案、拆解生产、 仓储销售、财务结算、管理后台七大业务域等开发任务。
---

# 鑫广汽拆回收 ERP 后台开发

## 路径配置

- **原型代码**：`C:\Users\29758\Downloads\汽拆+回收小程序设计20260716`（Figma Make 导出，React + shadcn，仅作 UI/交互/字段参考，不直接复制）
- **后端代码**：`D:\ROOT\QXB\xinguang-api\xinguang_api`（ThinkPHP / CRMEB，scrap 模块）
- **目标项目**：`art-design-pro`（Vue 3 + Element Plus + Pinia + Vue Router）

> 下文所有 `回收拆车项目/` 即原型代码目录，`xinguang_api/` 即后端代码目录。

## 范围约束（必须遵守）

- **只做 ERP 管理后台**，忽略小程序端全部页面与角色（owner/staff/reviewer/admin/driver）
- **不处理格式化**：不做无关 prettier/stylelint 调整

## 开发前必读

1. 读 `回收拆车项目/鑫广管理后台_UI设计规范文档_v1.md`（最新 PC 后台视觉/布局规范）
2. 读原型对应 admin 组件，理解页面结构、Tab、弹窗、筛选字段
3. 读 `回收拆车项目/src/app/types/order.ts` 获取订单/车辆状态枚举（**仅作业务参考，列表类型字段以 xinguang_api 接口为准**）
4. 订单/车辆优先读最新 PC 文档：`回收拆车项目/src/imports/_v3-PC_-_________-______.md`，再对照 `回收拆车项目/src/imports/_v2-PC_-____-____.md`
5. 读管理后台 PRD：优先 `回收拆车项目/docs/鑫广智能回收系统_全端完整PRD_v4.2.md` 第四章；再对照 `回收拆车项目/src/imports/___KZ__-___________PRD_______1_.md`
6. 对照 art-design-pro 现有页面惯例（如 `src/views/system/user/index.vue`、`src/views/recycle/recovery/orders/`）

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

### 最新 PC UI 规范（优先级最高）

来自 `鑫广管理后台_UI设计规范文档_v1.md`，新页面和重做页面必须优先遵守：

- 主色：`#4169FF`；悬停 `#3558DD`；渐变终点 `#5B7FFF`
- 页面背景：`#F8FAFF`；卡片白底；边框 `#E5E7EB` / `#F3F4F6`
- 内容区：`p-4 space-y-4`；标准列表页结构为「工具栏卡片 → 状态 Tab 卡片 → 表格卡片」
- 卡片圆角：`8px` / `12px`；阴影只用轻量 `shadow-sm`，不要重阴影
- 表格表头背景固定浅灰，订单号/档案号/单据号用蓝色可点击样式
- 状态必须用 Badge 展示，按语义区分：蓝=进行中、橙=待处理、绿=完成、红=异常、灰=草稿/终止
- 主按钮用 `#4169FF`，创建/导入类主操作可用 `#4169FF` → `#5B7FFF` 渐变
- 原型中的 Tailwind/lucide 只作视觉参考；Vue 实现仍用 Element Plus + Art 组件 + `ArtSvgIcon`

若当前已实现页面仍大量使用 `#1890FF`，本次只改需求相关区域，不为了统一颜色做无关格式化或大范围重刷样式。

### 框架对照

| 原型 (React)        | 目标 (Vue)                                        |
| ------------------- | ------------------------------------------------- |
| useState            | ref / reactive                                    |
| shadcn Dialog/Table | ElDialog / ArtTable（弹窗布局见「弹窗布局规范」） |
| lucide-react        | @iconify/vue 或 Element Plus 图标                 |
| 内联 Mock 数组      | `src/api/recycle/` + Pinia store                  |
| AdminDashboard 路由 | `src/router/modules/recycle.ts`                   |

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

### 弹窗布局规范（还原原型 + 本项目组件）

**核心原则：布局与视觉尽量对齐原型 JSX/Tailwind，控件一律用 Element Plus + 项目 Art 组件，禁止引入 shadcn 或手写原生 input/textarea/button。**

#### 弹窗类型与尺寸

| 类型 | 原型参考 | Vue 实现 | 典型尺寸 |
| --- | --- | --- | --- |
| 表单弹窗（新增/编辑） | `CustomerManagement.tsx` → `CustomerFormModal` | `ElDialog` + `ElForm` | `width="640px"` |
| 详情/审核弹窗 | `OrderManagementAdmin.tsx` → `renderReviewModal` 等 | `ElDialog` + 卡片分区布局 | `width="1200px"`，内容区限高滚动 |
| 确认/轻量弹窗 | 批量审核确认等 | `ElMessageBox` 或窄 `ElDialog` | `420px`～`500px` |
| 多步向导 | `CreateOrderWizard.tsx` | `ElDialog` + `ElSteps` + 分步 `ElForm` | 按原型宽度，通常 `800px`+ |

#### A. 表单弹窗（canonical：`src/views/recycle/customers/modules/customer-dialog.vue`）

新建/编辑类弹窗**直接复用该文件的 DOM 结构与 SCSS 写法**，不要参考 `system/user/modules/user-dialog.vue`（那是旧版 `label-width` 横排，与 ERP 原型不一致）。

**结构模板：**

```vue
<ElDialog
  v-model="dialogVisible"
  :title="dialogType === 'add' ? '新增xxx' : '编辑xxx'"
  width="640px"
  align-center
  destroy-on-close
  class="xxx-form-dialog"
>
  <ElForm ref="formRef" :model="formData" :rules="rules" label-position="top" class="xxx-form">
    <div class="form-block"><!-- 顶部选项，如 ElRadioGroup + ElRadioButton --></div>
    <div class="form-block">
      <div class="form-section-title">基本信息</div>
      <ElRow :gutter="16">
        <ElCol :span="12"><ElFormItem label="字段" prop="field"><ElInput /></ElFormItem></ElCol>
      </ElRow>
    </div>
  </ElForm>
  <template #footer>
    <ElButton @click="dialogVisible = false">取消</ElButton>
    <ElButton type="primary" :loading="submitting" @click="handleSubmit">保存</ElButton>
  </template>
</ElDialog>
```

**布局对照（原型 Tailwind → Vue）：**

| 原型 | Vue 实现 |
| --- | --- |
| `w-[640px] max-h-[90vh] flex flex-col` | `ElDialog width="640px"` + `:deep(.el-dialog__body) { max-height: calc(90vh - 120px); overflow-y: auto }` |
| `px-6 py-5 space-y-5` | `.xxx-form { padding: 0 24px }` + `.form-block + .form-block { margin-top: 20px }` |
| `text-xs font-semibold border-b border-gray-100` 分区标题 | `.form-section-title`（13px、600、底边 `#f0f0f0`） |
| `grid grid-cols-2 gap-4` | `ElRow :gutter="16"` + `ElCol :span="12"`，`:deep(.el-row) { row-gap: 16px }` |
| 类型切换 pill 按钮 | `ElRadioGroup` + `ElRadioButton`，选中色 `#1890FF` / `#E6F7FF` |
| `label` 在上、`input` 在下 | `label-position="top"`，label 14px、`var(--art-gray-600)` |

**表单控件映射（禁止原生 HTML）：**

- 文本 → `ElInput`
- 下拉 → `ElSelect` + `ElOption`
- 多行 → `ElInput type="textarea" :rows="3"`
- 单选组 → `ElRadioGroup` / `ElRadioButton` 或 `ElRadio`
- 日期 → `ElDatePicker`
- 开关 → `ElSwitch`
- 图标 → `ArtSvgIcon`（如 `ri:xxx-line`）

**脚本惯例：** `props: { visible, type, xxxData? }`；`emit('update:visible')` + `emit('submit')`；`watch(visible)` 内拉选项/回填；`destroy-on-close` 配合 `clearValidate()`。

#### B. 详情 / 审核弹窗（还原 `OrderManagementAdmin` 大卡片区）

原型特征：**自定义标题区（主标题 + 副标题订单号）→ 灰色滚动内容区 → 多个白卡片 → 高亮审核卡片 → 固定底栏操作按钮**。

```vue
<ElDialog
  v-model="visible"
  width="1200px"
  align-center
  destroy-on-close
  class="xxx-detail-dialog"
  :show-close="true"
>
  <template #header>
    <div class="dialog-header">
      <div class="dialog-header-main">客户申请报废 - 审核</div>
      <div class="dialog-header-sub">{{ order.order_no }}</div>
    </div>
  </template>

  <div class="dialog-body">
    <!-- 批次切换条（如有） -->
    <div class="info-card">...</div>
    <!-- 只读信息区 -->
    <div class="info-card">
      <div class="info-card-title">车辆信息</div>
      <ElRow :gutter="24">
        <ElCol :span="8"><div class="info-item"><div class="info-label">车牌号</div><div class="info-value">{{ row.plate_no }}</div></div></ElCol>
      </ElRow>
    </div>
    <!-- 审核重点高亮区 -->
    <div class="info-card info-card--highlight">...</div>
    <!-- 可编辑区仍用 ElFormItem + ElInput -->
    <div class="info-card">
      <ElFormItem label="驳回原因（可选）"><ElInput v-model="rejectReason" type="textarea" :rows="3" /></ElFormItem>
    </div>
  </div>

  <template #footer>
    <ElButton @click="visible = false">取消</ElButton>
    <ElButton class="btn-reject" @click="handleReject">驳回</ElButton>
    <ElButton class="btn-approve" type="success" @click="handleApprove">通过</ElButton>
  </template>
</ElDialog>
```

**样式 token（与原型 hex 对齐，优先写 SCSS 变量或类名）：**

| 用途            | 颜色                                                        |
| --------------- | ----------------------------------------------------------- |
| 内容区背景      | `#FAFAFA` / `var(--art-gray-100)`                           |
| 卡片边框        | `#E5E7EB` 或 `#D9D9D9`                                      |
| 卡片圆角        | `8px`（`rounded-lg`）                                       |
| 主色 / 批次标签 | 新页面用 `#4169FF`，旧订单模块局部可沿用 `#1890FF` 保持一致 |
| 审核高亮区      | 背景 `#FFF7E6`，边框 `#FFD591`，标题 `#FA8C16`              |
| 通过按钮        | `#52C41A`                                                   |
| 驳回按钮        | `#FF4D4F`                                                   |
| 只读 label      | 12px `#8C8C8C`；value 14px `#262626`                        |

**布局对照：**

| 原型 | Vue |
| --- | --- |
| `grid grid-cols-3 gap-x-6 gap-y-4` | `ElRow :gutter="24"` + `ElCol :span="8"` + `.info-item` 行间距 |
| `space-y-4` 卡片堆叠 | `.dialog-body { display: flex; flex-direction: column; gap: 16px }` |
| `h-[700px] flex flex-col` | `:deep(.el-dialog) { display: flex; flex-direction: column }` + body `flex:1; min-height:0; overflow-y:auto` |
| 批次车辆 Tab 按钮 | `ElButton` 或自定义 `.batch-vehicle-tab`，选中态 `#1890FF` 白字 |

**只读 vs 可编辑：** 展示字段用 `.info-label` + `.info-value` 纯文本；需要提交的数据（驳回原因、结算信息等）才包进 `ElForm` / `ElFormItem`。

#### C. 文件与样式组织

```
modules/
├── order-dialog.vue          # 模板 + 脚本
├── order-dialog.scss         # 样式超过 ~80 行时拆出，vue 内 @use './order-dialog.scss'
└── order-audit-dialog.vue    # 一种业务一种弹窗，禁止堆在 index.vue
```

- 表单弹窗 SCSS 可 scoped 写在 `.vue` 内；详情/审核弹窗建议独立 `.scss`，类名前缀与弹窗一致（如 `.order-audit-dialog`）。
- 弹窗内字段名用接口 **snake_case**（如 `real_name`、`plate_no`），展示文案对齐原型中文 label，**不要**沿用原型 mock 的 camelCase 字段名。

#### D. 开发检查清单

1. 对照原型 JSX：分区顺序、卡片数量、高亮块、底栏按钮是否与原型一致
2. 表单类：是否 `label-position="top"` + `form-block` / `form-section-title`
3. 是否全部使用 `ElInput` / `ElSelect` 等，无原生 `<input>` / `<textarea>`
4. 详情类：内容区是否灰底 + 白卡片 + 限高滚动
5. 审核类：通过/驳回按钮色是否与原型一致（绿/红，而非默认 primary/danger 混用）
6. `destroy-on-close` + 关闭时重置表单/索引状态（如批次车辆 `reviewVehicleIdx`）

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
6. 复杂弹窗/向导单独组件（表单弹窗对齐 `customer-dialog.vue`，详情/审核对齐原型卡片布局，见「弹窗布局规范」）
7. 自测：列表筛选、分页、详情弹窗、状态标签颜色
8. 类型检查 → 见下方「类型检查（用户手动执行）」，Agent 不自行跑全量 vue-tsc
```

### 类型检查（用户手动执行）

**Agent 禁止自行执行全量 `npx vue-tsc --noEmit`**（本项目体量大，全量检查常需 1～2 分钟，拖慢迭代）。

代码改完后，Agent 应**明确提示用户**执行类型检查；用户本地跑完后，**把终端报错原文贴回**，Agent 再据此修复。

**用户执行（项目根目录）：**

```bash
# 推荐：全量检查（改完一个模块后跑）
npx vue-tsc --noEmit

# 可选：只查本次改动的文件（更快）
npx vue-tsc --noEmit src/views/recycle/recovery/orders/index.vue
```

**Agent 话术示例：**

> 代码已改完，请你在项目根目录手动跑：`npx vue-tsc --noEmit`  
> 若有报错，把终端输出贴给我，我继续修。

**用户反馈格式（任选）：**

- 终端完整报错（含文件路径、行号、TS 错误码）
- IDE 里 TypeScript 红线文案
- 或确认「无报错」

**Agent 收到报错后：**

- 只修报错涉及的文件，不做无关重构
- 修完再次提示用户复跑，直到通过或用户确认可接受

**可替代/补充的验证（不等同于类型检查）：**

- `pnpm dev` + 浏览器控制台 / 网络面板（接口联调）
- IDE 实时诊断（Agent 可用 ReadLints 读已打开文件）

**常见 TS 踩坑（本仓库）：**

- `buildColumns` 动态 push 列时，给 `cols` 标注 `ColumnOption<T>[]`，否则 `align` 等字段报 TS2353
- `apiParams` / `replaceSearchParams` 里 `{ current: 1, ...searchForm.value }` 会被 spread 覆盖，应写成 `{ ...searchForm.value, current: 1 }`

### 列表项字段规范（必须遵守）

**列表项字段映射不要搞什么映射，直接用接口字段，不要映射 mock 字段！！！**

- `src/types/recycle/`：列表项 interface 与后端出参字段名一致（snake_case），**每个字段写中文备注**
- `src/api/recycle/`：`fetchXxxList` 禁止 `mapXxxItem`，直接 `return res.list`
- 页面表格：`prop` / `formatter` / 操作列用 `real_name`、`order_no`、`status` 等接口字段，禁止沿用原型 mock 的 camelCase 字段名
- 原型 `order.ts` 仅参考状态/交互，**不得**把其字段名当作前端列表类型

接口对接细则见 [xinguang-api-integration](../xinguang-api-integration/SKILL.md)。

## 状态与标签

从 `order.ts` 迁移 `STATUS_TEXT`、`STATUS_COLOR`、`ORDER_TYPE_CONFIG`，在 Vue 中用 `ElTag` / Badge 渲染。最新 PC 规范的状态色语义优先；订单类型标签沿用业务色：

- 线索：橙色系 `#FA8C16`
- 客户订单：紫色 `#722ED1`
- 员工订单：蓝色 `#1890FF`
- 拖车单：青色 `#13C2C2`

## 订单结算与附件签署（最新）

订单管理、详情、审核、创建/编辑弹窗必须覆盖这些字段与交互：

- 结算类型：个人结算 / 企业结算（旧文档或接口可能写“非个人结算”，展示文案以后端 `*_text` 或最新 PRD 为准）
- 结算方式：重量结算 / 整备质量结算 / 整车结算
- 结算字段：是否质检缺件免扣款、自送费补贴、残值/回收单价、结算金额
- 非个人结算：显示并提交发票金额、发票号码
- 代理人：有代理人时显示代理人姓名、电话、服务费、服务费发票号码
- 订单详情 Tab：基本信息、流程/日志、附件与签署；批量回收订单要支持切换车辆，车辆物流状态独立展示
- 附件签署：参考 `FormalOrderDetailModal.tsx`、`OrderSignature.tsx`，Vue 已有 `formal-order-attachments-tab.vue`、`sign-canvas-dialog.vue`、`sign-template-manager-dialog.vue`
- 签名状态：`unsigned`（未生成）、`uploaded_unsigned`（待签名）、`signed`（已签名）；待签附件支持单个签名、一键批量签名、保存/套用签名模板
- 附件类型以接口返回为准；无接口时可参考原型 11 类附件：报废机动车合同、反向开票、开票申请、回收价格审批表、回收价格审批价格模板标准、回收结算清单、回收证明、回收质检单、开票对账单、请款报销单、其他附件

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
- 不要照搬 shadcn 组件，统一用 Element Plus + 项目已有 Art 组件；弹窗布局还原原型，控件映射见「弹窗布局规范」
- **列表项不要搞字段映射，直接用接口字段，不要映射 mock 字段**
- 不要大范围重构无关模块
- 不要擅自 git commit（除非用户明确要求）
- **不要自行跑全量 `vue-tsc --noEmit`**，改完提示用户手动跑并贴回报错（见「类型检查（用户手动执行）」）

## 快速定位原型

| 需求 | 原型文件 |
| --- | --- |
| 订单管理/审核/线索 | `回收拆车项目/src/app/components/admin/OrderManagementAdmin.tsx` |
| 数据看板 | `admin/DataDashboard.tsx` |
| 车辆档案 | `admin/VehicleManagement.tsx` |
| 客户管理 | `admin/CustomerManagement.tsx` |
| 商务部对接 | `admin/CertificateManagement.tsx` |
| 正式订单详情/附件签署 | `admin/FormalOrderDetailModal.tsx`, `admin/OrderSignature.tsx` |
| 签名模板/批量签名 | `admin/FormalOrderDetailModal.tsx` |
| 质检/入厂 | `admin/QualityControl.tsx`, `admin/VehicleEntryManagement.tsx` |
| 拆解生产 | `admin/PickupManagement.tsx`, `admin/DismantlingManagement.tsx`, `admin/ProductionManagement.tsx` |
| 仓储/结算/报表 | `admin/InventoryManagement.tsx`, `admin/SettlementManagement.tsx`, `admin/ReportsCenter.tsx` |
| 系统配置 | `admin/SystemConfiguration.tsx` |
| 侧边栏布局参考 | `admin/AdminDashboard.tsx`（仅参考菜单结构） |

完整映射表见 [reference.md](reference.md)。
