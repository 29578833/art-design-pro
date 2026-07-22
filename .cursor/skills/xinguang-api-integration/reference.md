# xinguang_api 管理后台接口参考

> **后端**：`D:\ROOT\QXB\xinguang-api\xinguang_api`（下文简称 `xinguang_api/`）。路由文件：`xinguang_api/app/adminapi/route/scrap.php`，前缀 `/adminapi/scrap/`，鉴权 `AdminAuthTokenMiddleware` + `Authorization`。前端封装通常写 `/scrap/...`，由代理/baseURL 处理 adminapi 前缀。  
> **原型**（页面字段参考）：`C:\Users\29758\Downloads\汽拆+回收小程序设计20260716`（见 recycle-erp-backend skill）。

## 通用约定

### 列表响应

```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "list": [/* 记录数组 */],
    "count": 100
  }
}
```

### 分页请求参数

多数列表接口：

| 参数  | 类型 | 默认 | 说明     |
| ----- | ---- | ---- | -------- |
| page  | int  | 1    | 页码     |
| limit | int  | 15   | 每页条数 |

前端 useTable 需映射：`paginationKey: { current: 'page', size: 'limit' }`

### 时间戳字段

后端常用 Unix 时间戳（`add_time`），Services 层可能附加 `add_time_text`（`Y-m-d H:i:s`）。前端展示优先用 `*_text`。

---

## 模块路由速查

### 订单管理

| 方法 | 路径                 | Controller 方法           |
| ---- | -------------------- | ------------------------- |
| GET  | order/list           | ScrapOrder/index          |
| GET  | order/detail/:id     | ScrapOrder/detail         |
| POST | order/create         | ScrapOrder/create         |
| POST | order/audit          | ScrapOrder/audit          |
| POST | order/batch_audit    | ScrapOrder/batch_audit    |
| POST | order/assign         | ScrapOrder/assign         |
| GET  | order/status_options | ScrapOrder/status_options |
| GET  | order/counts         | ScrapOrder/counts         |
| GET  | order/export         | ScrapOrder/export         |

**列表筛选参数**：tab, status, keyword, lead_type, plate_no, vin, start_time, end_time, order_progress, source, recycle_type, sign_status, tow_status, follow_status, order_status, page, limit

**返回扩展字段**：order_type, order_type_text, current_status_text, plate_no, vin, vehicle_status_text, creator_name, batch_display

### 车辆管理

| 方法 | 路径                  | 说明         |
| ---- | --------------------- | ------------ |
| GET  | vehicle/list          | 车辆列表     |
| GET  | vehicle/status_counts | 状态统计     |
| GET  | vehicle/detail/:id    | 详情         |
| POST | vehicle/create        | 新增         |
| POST | vehicle/update/:id    | 修改         |
| GET  | vehicle/user_vehicles | 客户交车记录 |

### 线索管理

| 方法   | 路径                | 说明       |
| ------ | ------------------- | ---------- |
| GET    | lead/list           | 线索列表   |
| GET    | lead/detail/:id     | 详情       |
| POST   | lead/create         | 创建       |
| POST   | lead/follow/:id     | 跟进       |
| DELETE | lead/delete/:id     | 删除       |
| GET    | lead/pending_count  | 待跟进数量 |
| GET    | lead/export         | 导出       |
| GET    | lead/follow_persons | 跟进人列表 |
| POST   | lead/assign_follow  | 指派跟进人 |

### 质检 / 入厂

| 方法 | 路径                    | 说明     |
| ---- | ----------------------- | -------- |
| GET  | quality/list            | 质检列表 |
| GET  | quality/detail/:id      | 详情     |
| POST | quality/create          | 创建     |
| POST | quality/update          | 更新     |
| POST | quality/batch_audit     | 批量审核 |
| GET  | quality/queue           | 质检队列 |
| GET  | quality/stats           | 统计     |
| GET  | inspection/items        | 质检项目 |
| GET  | warehouse/entry_list    | 入库列表 |
| POST | warehouse/entry_save    | 车辆入库 |
| POST | warehouse/entry_confirm | 确认入厂 |
| GET  | warehouse/location_list | 库位列表 |

### 拆解 / 领料 / 产物

| 方法 | 路径                 | 说明         |
| ---- | -------------------- | ------------ |
| GET  | plate/list           | 拆解工单列表 |
| GET  | plate/counts         | 拆解统计     |
| GET  | plate/detail/:id     | 详情         |
| POST | plate/create         | 新增         |
| GET  | material/list        | 领料列表     |
| GET  | material/stats       | 领料统计     |
| POST | material/outbound    | 领料出库     |
| GET  | product_store/list   | 产物入库列表 |
| POST | product_store/create | 新建入库单   |

### 库存 / 销售出库

| 方法 | 路径                       | 说明         |
| ---- | -------------------------- | ------------ |
| GET  | inventory/item_list        | 库存物品列表 |
| GET  | inventory/item_stats       | 库存统计     |
| GET  | inventory/category_counts  | 分类统计     |
| GET  | sale_outbound/list         | 销售出库列表 |
| GET  | sale_outbound/stats        | 统计         |
| POST | sale_outbound/create       | 新建出库单   |
| POST | sale_outbound/approve/:id  | 审批         |
| POST | sale_outbound/complete/:id | 确认出库     |

### 结算 / 付款

| 方法 | 路径                          | 说明     |
| ---- | ----------------------------- | -------- |
| GET  | settlement/list               | 结算列表 |
| GET  | settlement/stats              | 统计     |
| GET  | settlement/calculate/:orderId | 金额计算 |
| POST | settlement/create             | 创建结算 |
| POST | settlement/audit/:id          | 财务审核 |
| POST | settlement/pay/:id            | 确认付款 |
| GET  | payment_log/list              | 付款流水 |
| GET  | payment_log/stats             | 流水统计 |

### 拖车

| 方法 | 路径                  | 说明         |
| ---- | --------------------- | ------------ |
| GET  | tow/list              | 拖车任务列表 |
| GET  | tow/detail/:id        | 详情         |
| POST | tow/create            | 创建         |
| POST | tow/assign_driver/:id | 指派司机     |
| POST | tow/update_status/:id | 更新状态     |

### 附件 / 电子签名

| 方法 | 路径                       | 说明                       |
| ---- | -------------------------- | -------------------------- |
| GET  | sign/templates             | 签名模板列表               |
| POST | sign/save_template         | 保存签名模板               |
| POST | sign/delete_template       | 删除签名模板               |
| POST | sign/sign                  | 附件签名，支持多个附件 ID  |
| POST | sign/sign_order            | 按订单批量签署所有待签附件 |
| GET  | sign/order_attachments/:id | 指定订单附件列表及签名状态 |

前端封装：`src/api/recycle/sign.ts`。签名前先上传签名图片拿到 `sign_url`，再调用签名接口。

### 数据看板 / 报表

| 方法 | 路径                     | 说明       |
| ---- | ------------------------ | ---------- |
| GET  | statistics/index         | 数据看板   |
| GET  | report/scrap_summary     | 收车汇总   |
| GET  | report/sales_performance | 业务员绩效 |

### 配置 / 字典 / 角色

| 方法 | 路径                   | 说明         |
| ---- | ---------------------- | ------------ |
| GET  | config/price_list      | 价格列表     |
| GET  | config/faq_list        | FAQ          |
| GET  | data_dict/list         | 数据字典     |
| GET  | data_dict/cllx_cascade | 车辆类型级联 |
| GET  | role/list              | 角色列表     |
| GET  | role/user_role_list    | 用户角色关联 |

### 办证 / 受理 / 登记

| 方法 | 路径             | 说明         |
| ---- | ---------------- | ------------ |
| GET  | certificate/list | 办证列表     |
| GET  | accept/list      | 受理列表     |
| GET  | bfdj/list        | 报废登记列表 |

---

## 前端目录对照

| 后端模块 | 前端 API | 前端页面 | 类型 |
| --- | --- | --- | --- |
| order | api/recycle/order.ts | views/recycle/recovery/orders/ | types/recycle/order.ts |
| sign | api/recycle/sign.ts | views/recycle/recovery/orders/modules/_sign_.vue | types/recycle/order.ts |
| vehicle | api/recycle/vehicle.ts | views/recycle/recovery/vehicles/ | types/recycle/vehicle.ts |
| lead | api/recycle/lead.ts | views/recycle/recovery/leads/ | types/recycle/lead.ts |
| settlement | api/recycle/settlement.ts | views/recycle/finance/ | types/recycle/settlement.ts |
| customer | 待确认后端接口 | views/recycle/customers/ | types/recycle/customer.ts |

> **客户管理**：当前前端用 Mock（`api/recycle/customer.ts`），scrap 路由中暂无独立 customer 模块，对接前需确认是否走 user 模块或其他接口。

---

## 前端 HTTP 层速查

| 文件                           | 作用                        |
| ------------------------------ | --------------------------- |
| src/utils/http/index.ts        | axios 封装，Token、错误处理 |
| src/utils/http/status.ts       | code 枚举（success=200）    |
| src/utils/table/tableConfig.ts | list/count 字段识别         |
| src/hooks/core/useTable.ts     | 列表页数据管理              |
| vite.config.ts                 | `/api` 代理                 |
| .env.development               | VITE_API_PROXY_URL          |

---

## 后端源码速查

> 后端代码绝对路径：`D:\ROOT\QXB\xinguang-api\xinguang_api`（目录树中简称 `xinguang_api/`）

| 文件                                       | 作用                          |
| ------------------------------------------ | ----------------------------- |
| app/adminapi/route/scrap.php               | 全部 scrap 路由               |
| app/adminapi/controller/v1/scrap/\*.php    | 入参定义                      |
| app/services/scrap/\*Services.php          | 返回字段、状态枚举 STATUS_MAP |
| app/adminapi/validate/scrap/\*Validate.php | 必填/格式校验                 |
| tests/scrap/\*Test.php                     | 业务规则测试                  |
