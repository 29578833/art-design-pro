/**
 * API 接口类型定义模块
 *
 * 提供所有后端接口的类型定义
 *
 * ## 主要功能
 *
 * - 通用类型（分页参数、响应结构等）
 * - 认证类型（登录、用户信息等）
 * - 系统管理类型（用户、角色等）
 * - 全局命名空间声明
 *
 * ## 使用场景
 *
 * - API 请求参数类型约束
 * - API 响应数据类型定义
 * - 接口文档类型同步
 *
 * ## 注意事项
 *
 * - 在 .vue 文件使用需要在 eslint.config.mjs 中配置 globals: { Api: 'readonly' }
 * - 使用全局命名空间，无需导入即可使用
 *
 * ## 使用方式
 *
 * ```typescript
 * const params: Api.Auth.LoginParams = { userName: 'admin', password: '123456' }
 * const response: Api.Auth.UserInfo = await fetchUserInfo()
 * ```
 *
 * @module types/api/api
 * @author Art Design Pro Team
 */

declare namespace Api {
  /** 通用类型 */
  namespace Common {
    /** 分页参数 */
    interface PaginationParams {
      /** 当前页码 */
      current: number
      /** 每页条数 */
      size: number
      /** 总条数 */
      total: number
    }

    /** 通用搜索参数 */
    type CommonSearchParams = Pick<PaginationParams, 'current' | 'size'>

    /** 分页响应基础结构 */
    interface PaginatedResponse<T = any> {
      records: T[]
      current: number
      size: number
      total: number
    }

    /** 启用状态 */
    type EnableStatus = '1' | '2'
  }

  /** 认证类型 */
  namespace Auth {
    /** 登录参数 */
    interface LoginParams {
      account: string
      pwd: string
    }

    /** 后端菜单节点 */
    interface BackendMenu {
      id: number
      pid: number
      path: string
      title: string
      icon: string
      header?: string
      is_header?: number
      is_show: number
      auth: string[]
      children?: BackendMenu[]
    }

    /** 登录接口原始响应 data */
    interface LoginResponseRaw {
      token: string
      expires_time: number
      menus: BackendMenu[]
      unique_auth: string[]
      user_info: {
        id: number
        account: string
        head_pic: string
        real_name: string
        level: number
      }
      site_name?: string
      logo?: string
      logo_square?: string
    }

    /** 登录结果（映射后） */
    interface LoginResult {
      token: string
      expiresTime: number
      userInfo: UserInfo
    }

    /** 发送密码重置验证码参数 */
    interface SendResetCodeParams {
      /** 管理员账号/邮箱/手机号 */
      account: string
      /** 注册手机号 */
      phone: string
    }

    /** 验证密码重置验证码参数 */
    interface VerifyResetCodeParams {
      /** 管理员账号/邮箱/手机号 */
      account: string
      /** 注册手机号 */
      phone: string
      /** 短信验证码 */
      code: string
    }

    /** 重置管理员密码参数 */
    interface ResetPasswordParams {
      /** 管理员账号/邮箱/手机号 */
      account: string
      /** 注册手机号 */
      phone: string
      /** 短信验证码 */
      code: string
      /** 新密码 */
      new_password: string
      /** 确认新密码 */
      confirm_password: string
    }
    /** 用户信息 */
    interface UserInfo {
      buttons: string[]
      menuIds: number[]
      userId: number
      userName: string
      realName?: string
      avatar?: string
      /** 兼容旧 Mock 字段 */
      roles?: string[]
      email?: string
    }
  }

  /** 系统管理类型 */
  namespace SystemManage {
    /** 用户列表 */
    type UserList = Api.Common.PaginatedResponse<UserListItem>

    /** 用户列表项 */
    interface UserListItem {
      id: number
      avatar: string
      status: string
      userName: string
      userGender: string
      nickName: string
      userPhone: string
      userEmail: string
      userRoles: string[]
      createBy: string
      createTime: string
      updateBy: string
      updateTime: string
    }

    /** 用户搜索参数 */
    type UserSearchParams = Partial<
      Pick<UserListItem, 'id' | 'userName' | 'userGender' | 'userPhone' | 'userEmail' | 'status'> &
        Api.Common.CommonSearchParams
    >

    /** 角色列表 */
    type RoleList = Api.Common.PaginatedResponse<RoleListItem>

    /** 角色列表项 */
    interface RoleListItem {
      roleId: number
      roleName: string
      roleCode: string
      description: string
      enabled: boolean
      createTime: string
    }

    /** 角色搜索参数 */
    type RoleSearchParams = Partial<
      Pick<RoleListItem, 'roleId' | 'roleName' | 'roleCode' | 'description' | 'enabled'> &
        Api.Common.CommonSearchParams & {
          startTime: string | null
          endTime: string | null
        }
    >
  }
  /** 系统通知（消息提醒） */
  namespace SystemNotice {
    /** 通知类型：1=订单通知 2=拖车通知 */
    type NoticeType = number | string

    /** 通知列表项（/jnotice 返回） */
    interface SystemNoticeItem {
      /** 主键 ID */
      id: number | string
      /** 标题 */
      title: string
      /** 内容 */
      content?: string
      /** 类型：1=订单通知 2=拖车通知 */
      type?: NoticeType
      /** 是否已读：0 未读 1 已读 */
      read?: number
      /** 时间（Unix 秒） */
      time?: number | string
      /** 分类 */
      category?: number | string
      /** 通知标识 */
      mark?: string
      /** 跳转链接 */
      url?: string
      /** 图标（后端兼容字段） */
      icon?: string
      /** 图标颜色（后端兼容字段） */
      iconColor?: string
    }
  }
}
