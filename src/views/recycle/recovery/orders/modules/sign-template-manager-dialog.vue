<template>
  <ElDialog
    v-model="dialogVisible"
    width="600px"
    align-center
    destroy-on-close
    :show-close="false"
    class="stm-dialog"
    @opened="loadTemplates"
  >
    <!-- Header -->
    <template #header>
      <div class="stm-header">
        <div class="stm-header-left">
          <ArtSvgIcon icon="ri:star-line" class="stm-header-icon" />
          <span class="stm-header-title">签名模板管理</span>
        </div>
        <button type="button" class="stm-close-btn" @click="dialogVisible = false">
          <ArtSvgIcon icon="ri:close-line" />
        </button>
      </div>
    </template>

    <!-- Body -->
    <div v-loading="loading" class="stm-body">
      <!-- 空状态 -->
      <div v-if="!loading && !templates.length" class="stm-empty">
        <ArtSvgIcon icon="ri:star-line" class="stm-empty-icon" />
        <p class="stm-empty-title">暂无签名模板</p>
        <p class="stm-empty-hint">签名时勾选"保存为模板"即可保存常用签名</p>
      </div>

      <!-- 模板列表 -->
      <div v-else class="stm-list">
        <div v-for="tpl in templates" :key="tpl.id" class="stm-row">
          <!-- 缩略图 -->
          <div class="stm-thumb-wrap">
            <img :src="tpl.sign_url" :alt="tpl.name" class="stm-thumb" />
          </div>

          <!-- 信息 -->
          <div class="stm-info">
            <p class="stm-name">{{ tpl.name || '未命名模板' }}</p>
            <p v-if="tpl.add_time" class="stm-time"> 创建时间：{{ formatTime(tpl.add_time) }} </p>
          </div>

          <!-- 删除 -->
          <ElPopconfirm
            title="确认删除该签名模板？"
            confirm-button-type="danger"
            confirm-button-text="确认删除"
            cancel-button-text="取消"
            @confirm="handleDelete(tpl.id)"
          >
            <template #reference>
              <button type="button" class="stm-del-btn" title="删除模板">
                <ArtSvgIcon icon="ri:delete-bin-line" class="stm-del-icon" />
              </button>
            </template>
          </ElPopconfirm>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <template #footer>
      <div class="stm-footer">
        <ElButton type="primary" @click="dialogVisible = false">关闭</ElButton>
      </div>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'
  import { fetchSignTemplates, fetchDeleteTemplate } from '@/api/recycle/sign'
  import type { SignatureTemplate } from '@/types/recycle/order'

  interface Props {
    visible: boolean
  }

  const props = defineProps<Props>()
  const emit = defineEmits<{
    (e: 'update:visible', v: boolean): void
  }>()

  const dialogVisible = computed({
    get: () => props.visible,
    set: (v) => emit('update:visible', v)
  })

  const loading = ref(false)
  const templates = ref<SignatureTemplate[]>([])

  async function loadTemplates() {
    loading.value = true
    try {
      templates.value = await fetchSignTemplates()
    } catch {
      templates.value = []
    } finally {
      loading.value = false
    }
  }

  async function handleDelete(id: number) {
    try {
      await fetchDeleteTemplate(id)
      templates.value = templates.value.filter((t) => t.id !== id)
      ElMessage.success('模板已删除')
    } catch (e: unknown) {
      ElMessage.error(e instanceof Error ? e.message : '删除失败')
    }
  }

  function formatTime(ts?: number): string {
    if (!ts) return ''
    return new Date(Number(ts) * 1000).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
  }
</script>

<style lang="scss">
  .stm-dialog {
    .el-dialog__header {
      padding: 0;
      border-bottom: 1px solid #f0f0f0;
    }

    .el-dialog__body {
      max-height: 500px;
      padding: 0;
      overflow-y: auto;
    }

    .el-dialog__footer {
      padding: 0;
      background: #fafafa;
      border-top: 1px solid #f0f0f0;
    }
  }
</style>

<style scoped lang="scss">
  /* ===== Header ===== */
  .stm-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 20px;
  }

  .stm-header-left {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .stm-header-icon {
    font-size: 16px;
    color: #1890ff;
  }

  .stm-header-title {
    font-size: 15px;
    font-weight: 600;
    color: #262626;
  }

  .stm-close-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    font-size: 16px;
    color: #8c8c8c;
    cursor: pointer;
    background: transparent;
    border: none;
    border-radius: 6px;
    transition: all 0.2s;

    &:hover {
      color: #262626;
      background: #f5f5f5;
    }
  }

  /* ===== Body ===== */
  .stm-body {
    min-height: 120px;
    padding: 16px 20px;
  }

  /* 空状态 */
  .stm-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 40px 0;
  }

  .stm-empty-icon {
    margin-bottom: 12px;
    font-size: 48px;
    color: #d9d9d9;
  }

  .stm-empty-title {
    margin: 0 0 4px;
    font-size: 14px;
    color: #8c8c8c;
  }

  .stm-empty-hint {
    margin: 0;
    font-size: 12px;
    color: #bfbfbf;
  }

  /* 列表 */
  .stm-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .stm-row {
    display: flex;
    gap: 16px;
    align-items: center;
    padding: 12px;
    background: #f8f9fb;
    border: 1px solid #e8e8e8;
    border-radius: 8px;
    transition: border-color 0.15s;

    &:hover {
      border-color: #d0e8f7;
    }
  }

  .stm-thumb-wrap {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 160px;
    height: 80px;
    overflow: hidden;
    background: #fff;
    border: 1px solid #e0e0e0;
    border-radius: 6px;
  }

  .stm-thumb {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  .stm-info {
    flex: 1;
    min-width: 0;
  }

  .stm-name {
    margin: 0 0 4px;
    overflow: hidden;
    font-size: 14px;
    font-weight: 600;
    color: #262626;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .stm-time {
    margin: 0;
    font-size: 12px;
    color: #8c8c8c;
  }

  .stm-del-btn {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    color: #ff4d4f;
    cursor: pointer;
    background: transparent;
    border: none;
    border-radius: 6px;
    transition: all 0.15s;

    &:hover {
      background: #fff1f0;
    }
  }

  .stm-del-icon {
    font-size: 16px;
  }

  /* ===== Footer ===== */
  .stm-footer {
    display: flex;
    justify-content: flex-end;
    padding: 12px 20px;
  }
</style>
