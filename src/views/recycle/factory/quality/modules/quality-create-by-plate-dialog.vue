<template>
  <ElDialog
    v-model="dialogVisible"
    width="500px"
    align-center
    destroy-on-close
    :show-close="false"
    class="qc-by-plate-dialog"
    @opened="onDialogOpened"
  >
    <template #header>
      <div class="qc-by-plate-header">
        <h3 class="qc-by-plate-title">新建质检单</h3>
        <button type="button" class="qc-by-plate-close" @click="dialogVisible = false">
          <ArtSvgIcon icon="ri:close-line" />
        </button>
      </div>
    </template>

    <div class="qc-by-plate-body">
      <div class="qc-by-plate-tip">
        <div class="qc-by-plate-tip-title">特殊流程说明</div>
        <p class="qc-by-plate-tip-desc">
          以车牌号创建质检单，系统将<strong>同步自动创建</strong>对应的「回收订单」和「车辆档案单」，仅车牌号有数据，其余资料状态标记为「已质检（待补资料）」，待各岗位后续补充完善。
        </p>
      </div>

      <div class="qc-by-plate-field">
        <label class="qc-by-plate-label">
          车牌号
          <span class="required">*</span>
        </label>
        <ElInput
          ref="plateInputRef"
          v-model="plateNo"
          placeholder="例：沪A·12345"
          maxlength="16"
          clearable
          @keyup.enter="handleConfirm"
        />
      </div>

      <div class="qc-by-plate-auto-grid">
        <div v-for="row in AUTO_INFO_ROWS" :key="row.label" class="qc-by-plate-auto-row">
          <span class="qc-by-plate-auto-label">{{ row.label }}：</span>
          <span class="qc-by-plate-auto-value">{{ row.value }}</span>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="qc-by-plate-footer">
        <ElButton class="qc-by-plate-btn-cancel" @click="dialogVisible = false">取消</ElButton>
        <ElButton
          type="primary"
          class="qc-by-plate-btn-submit"
          :loading="submitting"
          :disabled="!plateNo.trim()"
          @click="handleConfirm"
        >
          创建并开始质检
        </ElButton>
      </div>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'
  import { fetchCreateQualityByPlate } from '@/api/recycle/quality'
  import { useUserStore } from '@/store/modules/user'
  import type { QualityCreateByPlateResult, QualityQueueItem } from '@/types/recycle/quality'
  import { ElMessage, type InputInstance } from 'element-plus'

  interface Props {
    visible: boolean
  }

  const props = defineProps<Props>()
  const emit = defineEmits<{
    (e: 'update:visible', v: boolean): void
    (e: 'created', item: QualityQueueItem): void
  }>()

  const userStore = useUserStore()
  const plateInputRef = ref<InputInstance>()
  const plateNo = ref('')
  const submitting = ref(false)

  const dialogVisible = computed({
    get: () => props.visible,
    set: (v) => emit('update:visible', v)
  })

  const inspectorDisplay = computed(() => {
    const info = userStore.getUserInfo
    return info.realName || info.userName || '当前登录人（自动填写）'
  })

  const AUTO_INFO_ROWS = computed(() => [
    { label: '负责质检员', value: inspectorDisplay.value },
    { label: '质检单号', value: '系统自动生成' },
    { label: '回收订单', value: '自动创建（资料待补）' },
    { label: '车辆档案单', value: '自动创建（资料待补）' }
  ])

  watch(
    () => props.visible,
    (v) => {
      if (v) {
        plateNo.value = ''
        submitting.value = false
      }
    }
  )

  function onDialogOpened() {
    nextTick(() => {
      plateInputRef.value?.focus()
    })
  }

  function toQueueItem(res: QualityCreateByPlateResult, plate: string): QualityQueueItem {
    const checkId = Number(res.check_id ?? res.id ?? 0)
    return {
      vehicle_id: Number(res.vehicle_id || 0),
      order_id: Number(res.order_id || 0),
      check_id: checkId || undefined,
      plate_no: (res.plate_no as string) || plate,
      inspection_no: (res.check_no as string) || undefined,
      queue_status: 'in_progress',
      queue_status_text: '质检中'
    }
  }

  async function handleConfirm() {
    const plate = plateNo.value.trim()
    if (!plate) {
      ElMessage.warning('请输入车牌号')
      return
    }
    submitting.value = true
    try {
      const res = await fetchCreateQualityByPlate(plate)
      const item = toQueueItem(res || {}, plate)
      if (!item.check_id && !item.vehicle_id) {
        ElMessage.error('创建成功但未返回质检单信息')
        return
      }
      dialogVisible.value = false
      emit('created', item)
    } catch {
      // 错误已由 http 拦截器处理
    } finally {
      submitting.value = false
    }
  }
</script>

<style lang="scss">
  .qc-by-plate-dialog {
    padding: 0 !important;

    .el-dialog__header {
      padding: 0;
      margin: 0;
    }

    .el-dialog__body {
      padding: 0 24px;
    }

    .el-dialog__footer {
      padding: 0 24px 24px;
    }
  }
</style>

<style scoped lang="scss">
  .qc-by-plate-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 24px 24px 0;
  }

  .qc-by-plate-title {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: #111827;
  }

  .qc-by-plate-close {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    font-size: 20px;
    color: #9ca3af;
    cursor: pointer;
    background: transparent;
    border: none;

    &:hover {
      color: #6b7280;
    }
  }

  .qc-by-plate-body {
    padding-top: 16px;
  }

  .qc-by-plate-tip {
    padding: 12px;
    margin-bottom: 16px;
    font-size: 12px;
    background: #e6f7ff;
    border-radius: 8px;
  }

  .qc-by-plate-tip-title {
    margin-bottom: 4px;
    font-weight: 500;
    color: #1890ff;
  }

  .qc-by-plate-tip-desc {
    margin: 0;
    line-height: 1.625;
    color: #4b5563;

    strong {
      font-weight: 600;
      color: inherit;
    }
  }

  .qc-by-plate-field {
    margin-bottom: 16px;
  }

  .qc-by-plate-label {
    display: block;
    margin-bottom: 6px;
    font-size: 12px;
    color: #4b5563;
  }

  .required {
    color: #ff4d4f;
  }

  .qc-by-plate-auto-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
    padding: 12px;
    margin-bottom: 20px;
    font-size: 12px;
    background: #f9fafb;
    border-radius: 8px;
  }

  .qc-by-plate-auto-row {
    display: flex;
    gap: 4px;
    min-width: 0;
  }

  .qc-by-plate-auto-label {
    flex-shrink: 0;
    color: #9ca3af;
  }

  .qc-by-plate-auto-value {
    color: #374151;
  }

  .qc-by-plate-footer {
    display: flex;
    gap: 12px;
  }

  .qc-by-plate-btn-cancel,
  .qc-by-plate-btn-submit {
    flex: 1;
    height: 36px;
    margin: 0;
  }

  .qc-by-plate-btn-cancel {
    color: #4b5563;
    border-color: #d1d5db;
  }

  .qc-by-plate-btn-submit {
    background: #1890ff;
    border-color: #1890ff;

    &:hover:not(:disabled) {
      background: #1677ff;
      border-color: #1677ff;
    }
  }
</style>
