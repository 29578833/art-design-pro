---
name: xinguang-api-integration
description: >-
  将 art-design-pro 前端页面对接 xinguang_api 后端接口。适用于用户提及接口对接、API 联调、 xinguang_api、adminapi、scrap 路由、替换 Mock、分页字段映射、字段转换等任务。 与 recycle-erp-backend skill 配合使用：前者负责页面实现，本 skill 负责前后端 API 对接。
---

# xinguang_api 前后端接口对接

## 范围

- **前端**：`art-design-pro`（Vue 3 + Element Plus）
- **后端**：`xinguang_api/`（ThinkPHP / CRMEB，报废回收业务在 `scrap` 模块）
- **只做 ERP 管理后台**：对接 `app/adminapi/route/scrap.php`，忽略 `app/api/route/scrap.php` 小程序接口

页面开发规范见 [recycle-erp-backend](../recycle-erp-backend/SKILL.md)，本 skill 只覆盖 API 层对接。

## 对接前必读（按顺序）

1. 确认用户给的 URL → 在 `xinguang_api/app/adminapi/route/scrap.php` 找对应路由
2. 读 Controller 的 `getMore` / `postMore` 参数 → 确定请求字段
3. 读 Services 返回结构 → 确定 `data` 内字段（通常是 `{ list, count }`）
4. 读前端页面/类型 → 确定 camelCase 字段与枚举映射
5. 写 `src/api/recycle/xxx.ts` → 改页面去掉 Mock → 自测列表/详情/提交

完整路由清单见 [reference.md](reference.md)。

## 接口 URL 规范

| 层级             | 路径                                       |
| ---------------- | ------------------------------------------ |
| 后端路由定义     | `scrap/order/list`（相对 adminapi 路由组） |
| Controller 注释  | `/adminapi/scrap/order/list`               |
| 前端 request url | `/adminapi/scrap/order/list`               |

开发环境 Vite 代理：`/api` → `VITE_API_PROXY_URL`。若后端无前缀重写，前端 url 用 `/adminapi/scrap/...`；若走 Apifox Mock，按 Mock 实际路径写。

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
    url: '/adminapi/scrap/order/list',
    params
  })
}

/** 审核订单 */
export function fetchAuditOrder(data: { id: number; status: number; remark?: string }) {
  return request.post({
    url: '/adminapi/scrap/order/audit',
    params: data,
    showSuccessMessage: true
  })
}
```

约定：

- 函数名 `fetch` + 动作 + 资源
- GET 用 `params`，POST/PUT 用 `params`（http 层会自动转 body）
- 写操作加 `showSuccessMessage: true`
- 一个业务域一个文件：`order.ts`、`vehicle.ts`、`settlement.ts`

## 字段映射

后端 snake_case，前端 camelCase。在 API 层或 `dataTransformer` 做转换，**不要改后端字段名**。

```typescript
function mapOrderItem(raw: Record<string, unknown>): OrderItem {
  return {
    id: raw.id as number,
    orderNo: raw.order_no as string,
    realName: raw.real_name as string,
    addTime: (raw.add_time_text as string) || (raw.add_time as string),
    statusText: raw.current_status_text as string
  }
}
```

优先使用后端已输出的 `*_text` 展示字段（如 `order_type_text`、`vehicle_status_text`），避免前端重复维护枚举。

空值筛选：前端 `'all'` / `undefined` 不要传给后端，在 API 或 search 提交前过滤。

## 从 Mock 迁移到真实接口

1. 保留 `src/types/recycle/` 类型，按后端字段调整
2. 替换 `src/api/recycle/xxx.ts` 中 Mock 实现为 `request.get/post`
3. 页面 `useTable.apiFn` 指向新函数，加 `paginationKey`
4. 弹窗 submit 调 create/update 接口，成功后 `refreshData()`
5. 详情抽屉调 detail 接口或用列表行数据（视交互而定）

## 读后端源码定位参数

```
xinguang_api/
├── app/adminapi/route/scrap.php      # 路由 → Controller 方法
├── app/adminapi/controller/v1/scrap/ # 入参 getMore/postMore
├── app/services/scrap/               # 业务逻辑、返回字段、枚举
├── app/adminapi/validate/scrap/      # 校验规则（必填项）
└── tests/scrap/                      # 接口行为参考
```

Controller 示例：`ScrapOrder.php` → `index()` 接受 `page`、`limit`、`keyword`、`status` 等。

## 单模块对接流程

```
- [ ] 1. 用户给 URL 列表 → 对照 scrap.php 确认
- [ ] 2. 读 Controller + Services → 记录入参/出参
- [ ] 3. 写 types（src/types/recycle/）
- [ ] 4. 写 api（src/api/recycle/）
- [ ] 5. 改 index.vue：useTable paginationKey + apiFn
- [ ] 6. 改 modules：dialog/drawer/search 字段对齐
- [ ] 7. 自测：筛选、分页、新增、编辑、详情、错误提示
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
- 不要处理无关格式化
- 不要擅自 git commit
- 不要假设分页字段为 `current/size` 或 `records/total`，以 Controller 为准

## 用户提供接口信息时的期望格式

```
模块：订单管理
- GET  /adminapi/scrap/order/list       列表（page, limit, keyword, status）
- GET  /adminapi/scrap/order/detail/:id 详情
- POST /adminapi/scrap/order/audit      审核（id, status, remark）
```

收到后直接按「单模块对接流程」执行，缺参数时读 Controller 源码补全。
