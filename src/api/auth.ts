import request from '@/utils/http'

/** 递归收集菜单 id */
function collectMenuIds(menus: Api.Auth.BackendMenu[]): number[] {
  const ids: number[] = []
  for (const menu of menus) {
    ids.push(menu.id)
    if (menu.children?.length) {
      ids.push(...collectMenuIds(menu.children))
    }
  }
  return ids
}

/** 将登录接口原始响应映射为前端结构 */
export function mapLoginResponse(raw: Api.Auth.LoginResponseRaw): Api.Auth.LoginResult {
  return {
    token: raw.token,
    expiresTime: raw.expires_time,
    userInfo: {
      userId: raw.user_info.id,
      userName: raw.user_info.account,
      realName: raw.user_info.real_name,
      avatar: raw.user_info.head_pic,
      buttons: raw.unique_auth ?? [],
      menuIds: collectMenuIds(raw.menus ?? [])
    }
  }
}

/**
 * 登录
 * @param params 登录参数
 * @returns 登录结果
 */
export function fetchLogin(params: Api.Auth.LoginParams) {
  return request
    .post<Api.Auth.LoginResponseRaw>({
      url: '/login',
      params
    })
    .then(mapLoginResponse)
}

/**
 * 获取用户信息（备用，登录数据已持久化时可跳过）
 * @returns 用户信息
 */
export function fetchGetUserInfo() {
  return request.get<Api.Auth.UserInfo>({
    url: '/api/user/info'
  })
}

/**
 * 发送密码重置验证码
 * @param params 管理员账号与注册手机号
 * @returns 发送结果
 */
export function fetchSendResetCode(params: Api.Auth.SendResetCodeParams) {
  return request.post<null>({
    url: '/send_reset_code',
    params,
    showErrorMessage: false,
    showSuccessMessage: true
  })
}

/**
 * 验证密码重置验证码
 * @param params 管理员账号、注册手机号与验证码
 * @returns 验证结果
 */
export function fetchVerifyResetCode(params: Api.Auth.VerifyResetCodeParams) {
  return request.post<null>({
    url: '/verify_reset_code',
    params,
    showErrorMessage: false
  })
}

/**
 * 重置管理员密码
 * @param params 管理员账号、手机号、验证码与新密码
 * @returns 重置结果
 */
export function fetchResetPassword(params: Api.Auth.ResetPasswordParams) {
  return request.post<null>({
    url: '/reset_password',
    params,
    showErrorMessage: false,
    showSuccessMessage: true
  })
}
