---
name: xinguang-api-integration
description: >-
  将 art-design-pro 前端页面对接 xinguang_api 后端接口。适用于用户提及接口对接、API 联调、 xinguang_api、adminapi、scrap 路由、替换 Mock、分页参数映射等任务。 列表项直接使用接口 snake_case 原字段，禁止映射 mock/camelCase 字段。 与 recycle-erp-backend skill 配合使用：前者负责页面实现，本 skill 负责前后端 API 对接。
---

# xinguang_api 前后端接口对接

## 范围

- **前端**：`art-design-pro`（Vue 3 + Element Plus）
- **后端**：`xinguang_api/`（ThinkPHP / CRMEB，报废回收业务在 `scrap` 模块）
- **只做 ERP 管理后台**：对接 `app/adminapi/route/scrap.php`，忽略 `app/api/route/scrap.php` 小程序接口

页面开发规范见 [recycle-erp-backend](../recycle-erp-backend/SKILL.md)，本 skill 只覆盖 API 层对接。

## 对接前必读（按顺序）

1. 确认用户给的 URL → 优先在当前前端 `src/api/recycle/` 查已有封装；有后端源码时再到 `xinguang_api/app/adminapi/route/scrap.php` 找对应路由
2. 读 Controller 的 `getMore` / `postMore` 参数 → 确定请求字段
3. 读 Services 返回结构 → 确定 `data` 内字段（通常是 `{ list, count }`）
4. 读前端页面/类型 → 确定接口原字段（snake_case）与展示逻辑
5. 写 `src/api/recycle/xxx.ts` → 改页面去掉 Mock → 自测列表/详情/提交

完整路由清单见 [reference.md](reference.md)。

## 接口 URL 规范

| 层级             | 路径                                       |
| ---------------- | ------------------------------------------ |
| 后端路由定义     | `scrap/order/list`（相对 adminapi 路由组） |
| Controller 注释  | `/adminapi/scrap/order/list`               |
| 前端 request url | 当前项目多用 `/scrap/order/list`           |

开发环境 Vite 代理：`/api` → `VITE_API_PROXY_URL`。当前 `src/api/recycle/order.ts`、`sign.ts` 使用 `/scrap/...`；除非确认代理或后端前缀变化，不要擅自改成 `/adminapi/scrap/...`。

改后端地址：`.env.development` 的 `VITE_API_PROXY_URL`。

## 响应格式

后端统一：

```json
{ "code": 200, "msg": "success", "data": { "list": [], "count": 0 } }
```

前端 `src/utils/http/index.ts` 已封装：`code === 200` 时返回 `data`，401 自动登出。

## 分页参数映射（关键）

| 前端 useTable 默认 | xinguang_api 常用 | 说明                     |
| ------------------ | ----------------- | ------------------------ |
| `current`          | `page`            | 当前页，默认 1           |
| `size`             | `limit`           | 每页条数，默认 15        |
| —                  | `count`           | 响应总条数（非 `total`） |

**列表页必须在 useTable 配置分页映射：**

```typescript
useTable({
  core: {
    apiFn: fetchOrderList,
    paginationKey: { current: 'page', size: 'limit' }
  }
})
```

`tableUtils.defaultResponseAdapter` 已支持 `list` + `count`，一般无需自定义 `responseAdapter`。

## API 文件模板

```typescript
// src/api/recycle/order.ts
import request from '@/utils/http'
import type { OrderList, OrderSearchParams } from '@/types/recycle/order'

/** 订单列表 */
export function fetchOrderList(params: OrderSearchParams) {
  return request.get<OrderList>({
    url: '/scrap/order/list',
    params
  })
}

/** 审核订单 */
export function fetchAuditOrder(data: { id: number; status: number; remark?: string }) {
  return request.post({
    url: '/scrap/order/audit',
    params: data,
    showSuccessMessage: true
  })
}
```

约定：

- 函数名 `fetch` + 动作 + 资源
- GET 用 `params`；POST/PUT 优先沿用同文件现有写法（订单接口多用 `params`，签名/上传相关已用 `data`）
- 写操作加 `showSuccessMessage: true`
- 一个业务域一个文件：`order.ts`、`vehicle.ts`、`settlement.ts`

## 列表项字段规范（必须遵守）

**列表项字段映射不要搞什么映射，直接用接口字段，不要映射 mock 字段！！！**

### 核心原则

1. **列表项原样透传**：`fetchXxxList` 直接返回 `res.list`，禁止 `mapXxxItem` / `dataTransformer` 把接口字段转成 mock 或 camelCase 字段
2. **类型与接口一致**：`src/types/recycle/` 中列表项 interface 使用后端 snake_case 原字段名，**每个字段添加中文备注**
3. **页面直接读接口字段**：表格 `prop`、`formatter`、操作列判断统一用 `order_no`、`real_name`、`status` 等，不要造 `orderNo`、`customerName` 等 mock 字段
4. **展示辅助函数允许**：`getOrderDisplayNo`、`isLeadOrder` 等只做展示/判断，**不复制、不改名**接口数据
5. **优先 `*_text`**：展示文案用后端已输出的 `order_type_text`、`current_status_text` 等，避免前端重复维护枚举

### 类型定义示例（字段带中文备注）

```typescript
// src/types/recycle/order.ts
/** 订单列表项（直接使用接口字段，不做映射） */
export interface RecycleOrder {
  /** 主键 ID */
  id: number
  /** 订单编号 */
  order_no?: string
  /** 拖车单编号 */
  tow_no?: string
  /** 订单类型：vehicle_lead / customer_lead / customer_order / staff_order / tow */
  order_type: string
  /** 订单类型文案 */
  order_type_text?: string
  /** 状态码 */
  status: number
  /** 当前状态文案 */
  current_status_text?: string
  /** 客户姓名 */
  real_name?: string
  /** 联系电话 */
  phone?: string
  /** 车牌号 */
  plate_no?: string
  /** 创建时间文案 */
  add_time_text?: string
  /** 创建人 */
  creator_name?: string
  [key: string]: unknown
}
```

### API 列表示例（禁止 map）

```typescript
/** 获取订单列表 — 直接返回接口 list */
export async function fetchOrderList(params: OrderSearchParams): Promise<OrderList> {
  const res = await request.get<{ list: RecycleOrder[]; count: number }>({
    url: '/scrap/order/list',
    params: buildListParams(params)
  })
  return {
    records: res.list || [],
    total: res.count || 0,
    current: page,
    size: limit
  }
}
```

### 页面列表示例（直接读接口字段）

```typescript
{
  prop: 'real_name',
  label: '客户信息',
  formatter: (row: RecycleOrder) => `${row.real_name || '—'} / ${row.phone || '—'}`
},
{
  prop: 'current_status_text',
  label: '当前状态',
  formatter: (row: RecycleOrder) => row.current_status_text || '—'
}
```

### 请求参数

- 传给后端的查询参数可与接口 `getMore` 字段对齐（如 `page`、`limit`、`order_status`）
- 若项目约定「无值也传空字符串」，在 `buildListParams` 统一处理，**列表响应项仍不做字段映射**

### 禁止事项（字段相关）

- 禁止 `mapOrderItem`、`mapOrderType`、`mapOrderStatus` 等把列表项转成 mock/原型字段
- 禁止把 `order_no` 映射成 `orderNo`、`real_name` 映射成 `customerName`
- 禁止在 API 层维护一套与接口平行的 camelCase 列表类型

## 从 Mock 迁移到真实接口

1. 保留 `src/types/recycle/` 类型，字段与后端出参一致（snake_case + 中文备注）
2. 替换 `src/api/recycle/xxx.ts` 中 Mock 实现为 `request.get/post`，**列表项不做字段映射**
3. 页面 `useTable.apiFn` 指向新函数，加 `paginationKey`
4. 弹窗 submit 调 create/update 接口，成功后 `refreshData()`
5. 详情抽屉调 detail 接口或用列表行数据（视交互而定）

## 签名与附件接口（当前前端已有）

对应文件：`src/api/recycle/sign.ts`。订单详情附件 Tab、签名画布、签名模板管理必须复用这些封装：

| 功能 | 前端函数 | 路径 | 关键参数 |
| --- | --- | --- | --- |
| 签名模板列表 | `fetchSignTemplates` | `/scrap/sign/templates` | - |
| 保存模板 | `fetchSaveTemplate` | `/scrap/sign/save_template` | `name`, `sign_url` |
| 删除模板 | `fetchDeleteTemplate` | `/scrap/sign/delete_template` | `id` |
| 附件签名 | `fetchSignAttachments` | `/scrap/sign/sign` | `attach_id` 逗号分隔, `sign_url` |
| 订单批量签名 | `fetchSignOrder` | `/scrap/sign/sign_order` | `order_id` 逗号分隔, `sign_url` |
| 订单附件列表 | `fetchOrderAttachments` | `/scrap/sign/order_attachments/:orderId` | `orderId` |

签名前先用项目上传接口拿到签名图片 URL（`uploadFileGetUrl`），再传 `sign_url`。附件列表项直接使用接口字段：`download_url`、`sign_url`、`sign_by`、`sign_status`、`sign_time`、`signed`，不要映射成 camelCase。

附件状态判断：

- 无 `download_url`：`unsigned`（未生成，只展示状态）
- 有 `download_url` 且未签：`uploaded_unsigned`（可查看、可签名）
- `sign_status === 1` 或 `signed === true`：`signed`（已签名）

## 读后端源码定位参数

```
xinguang_api/
├── app/adminapi/route/scrap.php      # 路由 → Controller 方法
├── app/adminapi/controller/v1/scrap/ # 入参 getMore/postMore
├── app/services/scrap/               # 业务逻辑、返回字段、枚举
├── app/adminapi/validate/scrap/      # 校验规则（必填项）
└── tests/scrap/                      # 接口行为参考
```

Controller 示例：`ScrapOrder.php` → `index()` 接受 `page`、`limit`、`keyword`、`status` 等。当前仓库未包含 `xinguang_api` 时，以 `src/api/recycle/` 现有封装和用户提供接口为准，不凭空补后端路由。

## 单模块对接流程

```
- [ ] 1. 用户给 URL 列表 → 对照 scrap.php 确认
- [ ] 2. 读 Controller + Services → 记录入参/出参
- [ ] 3. 写 types（src/types/recycle/，接口原字段 + 中文备注）
- [ ] 4. 写 api（src/api/recycle/，列表直接返回 res.list，禁止 map）
- [ ] 5. 改 index.vue：useTable paginationKey + apiFn
- [ ] 6. 改 modules：dialog/drawer/search 字段对齐
- [ ] 7. 自测：筛选、分页、新增、编辑、详情、错误提示
- [ ] 8. 类型检查：提示用户手动跑 `npx vue-tsc --noEmit`，报错贴回后再修（见 recycle-erp-backend「类型检查（用户手动执行）」）
```

## 与 recycle-erp-backend 分工

| 任务                         | 用哪个 skill                           |
| ---------------------------- | -------------------------------------- |
| 新建页面、UI、路由、原型迁移 | recycle-erp-backend                    |
| 对接 xinguang_api 真实接口   | **本 skill**                           |
| 两者都需要                   | 先读 recycle-erp-backend，再读本 skill |

## 禁止事项

- 不要对接小程序 API（`app/api/route/scrap.php`）
- 不要改 `xinguang_api` 后端代码（除非用户明确要求）
- **列表项不要搞字段映射，直接用接口字段，不要映射 mock 字段**
- 不要处理无关格式化
- 不要擅自 git commit
- **不要自行跑全量 `vue-tsc --noEmit`**，对接改完后提示用户手动检查（见 recycle-erp-backend skill）
- 不要假设分页字段为 `current/size` 或 `records/total`，以 Controller 为准

## 用户提供接口信息时的期望格式

```
模块：订单管理
- GET  /adminapi/scrap/order/list       列表（page, limit, keyword, status）
- GET  /adminapi/scrap/order/detail/:id 详情
- POST /adminapi/scrap/order/audit      审核（id, status, remark）
```

收到后直接按「单模块对接流程」执行，缺参数时读 Controller 源码补全。
