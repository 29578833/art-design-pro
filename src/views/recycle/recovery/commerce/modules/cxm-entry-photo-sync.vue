<template>
  <div class="cxm-entry-sync">
    <span v-if="loggedIn" class="cxm-entry-sync__badge">
      <ArtSvgIcon icon="ri:checkbox-circle-fill" />
      车信盟已登录
    </span>
    <ElButton size="small" plain type="primary" :loading="syncing" @click="handleSync">
      手动同步照片
    </ElButton>
    <CxmSyncResultDialog v-model:visible="resultVisible" :message="resultMessage" :result="result" />
    <CxmLoginDialog v-model:visible="loginVisible" @success="onLoginSuccess" />
  </div>
</template>

<script setup lang="ts">
  import { ElMessage, ElMessageBox } from 'element-plus'
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'
  import {
    fetchAcceptCheckToken,
    fetchSyncDismantlePhotos,
    fetchSyncEntryPhotos,
    type SyncEntryPhotosResult
  } from '@/api/recycle/accept'
  import CxmSyncResultDialog from './cxm-sync-result-dialog.vue'
  import CxmLoginDialog from './cxm-login-dialog.vue'

  defineOptions({ name: 'CxmEntryPhotoSync' })

  const props = defineProps<{
    vehicleId?: number | string
    /** quality：入场照片同步；dismantle：拆解照片同步 */
    syncType: 'quality' | 'dismantle'
    /** 质检同步前先保存当前照片 */
    beforeSync?: () => Promise<unknown>
  }>()

  const loggedIn = ref(false)
  const syncing = ref(false)
  const loginVisible = ref(false)
  const resultVisible = ref(false)
  const resultMessage = ref('')
  const result = ref<SyncEntryPhotosResult | null>(null)
  let loginResolver: ((ok: boolean) => void) | null = null
  let loginPassed = false

  function finishLogin(ok: boolean) {
    const resolve = loginResolver
    loginResolver = null
    resolve?.(ok)
  }

  /** 未登录时弹出登录框，登录成功后继续同步 */
  function waitLogin() {
    loginVisible.value = true
    return new Promise<boolean>((resolve) => {
      loginResolver = resolve
    })
  }

  function onLoginSuccess() {
    loggedIn.value = true
    loginPassed = true
    finishLogin(true)
  }

  watch(loginVisible, (visible) => {
    if (visible) return
    nextTick(() => {
      if (loginPassed) {
        loginPassed = false
        return
      }
      finishLogin(false)
    })
  })

  /** 接口未明确返回无效时，视为已登录 */
  function isTokenValid(res: unknown) {
    if (res === false) return false
    if (res != null && typeof res === 'object') {
      const data = res as { valid?: boolean; token_valid?: boolean }
      if (data.valid === false || data.token_valid === false) return false
    }
    return true
  }

  async function refreshLogin() {
    try {
      loggedIn.value = isTokenValid(await fetchAcceptCheckToken())
    } catch {
      loggedIn.value = false
    }
    return loggedIn.value
  }

  async function handleSync() {
    const vehicleId = Number(props.vehicleId || 0)
    if (!vehicleId) {
      ElMessage.warning('缺少车辆信息')
      return
    }
    const logged = await refreshLogin()
    if (!logged) {
      const ok = await waitLogin()
      if (!ok) return
    }
    const isDismantle = props.syncType === 'dismantle'
    try {
      await ElMessageBox.confirm(
        isDismantle ? '确定要同步拆解照片到车信盟吗？' : '确定要同步入场照片到车信盟吗？',
        '提示',
        {
          type: 'warning',
          confirmButtonText: '确定',
          cancelButtonText: '取消'
        }
      )
    } catch {
      return
    }
    syncing.value = true
    try {
      // 照片在未保存的表单里，先落库同步接口才能取到
      if (props.beforeSync) {
        await props.beforeSync()
      }
      const data = isDismantle
        ? await fetchSyncDismantlePhotos(vehicleId)
        : await fetchSyncEntryPhotos(vehicleId)
      result.value = data || {}
      const success = Number(data?.success || 0)
      const failed = Number(data?.failed || 0)
      resultMessage.value = `同步完成：成功 ${success} 张，失败 ${failed} 张`
      resultVisible.value = true
    } catch {
      // 错误已由 http 拦截器处理
    } finally {
      syncing.value = false
    }
  }

  onMounted(refreshLogin)
</script>

<style scoped lang="scss">
  .cxm-entry-sync {
    display: flex;
    flex-shrink: 0;
    gap: 8px;
    align-items: center;

    &__badge {
      display: inline-flex;
      gap: 4px;
      align-items: center;
      padding: 2px 8px;
      font-size: 12px;
      line-height: 20px;
      color: #52c41a;
      white-space: nowrap;
      background: #f6ffed;
      border: 1px solid #b7eb8f;
      border-radius: 999px;
    }
  }
</style>
