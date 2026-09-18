<template>
  <ElDialog
    v-model="dialogVisible"
    width="640px"
    align-center
    destroy-on-close
    class="work-preprocess-dialog"
    @closed="handleClosed"
  >
    <template #header>
      <div class="preprocess-dialog-header">
        <div class="preprocess-dialog-title">预处理工序（工序一）</div>
        <div class="preprocess-dialog-sub">
          {{ plateItem?.plate_no || '—' }} · {{ plateItem?.vehicle_model || '—' }} · 共
          {{ stepStates.length }} 项
        </div>
      </div>
    </template>

    <div v-loading="loading" class="preprocess-dialog-body">
      <div class="preprocess-progress">已确认 {{ confirmedCount }} / {{ stepStates.length }} 项</div>

      <div class="preprocess-step-list">
        <div
          v-for="(step, index) in stepStates"
          :key="step.step_key"
          class="preprocess-step-item"
          :class="{
            'is-has': step.has === 1,
            'is-none': step.has === 0,
            'is-readonly': readonly
          }"
        >
          <div class="preprocess-step-header">
            <span class="preprocess-step-name">{{ index + 1 }}. {{ step.step_name }}</span>
            <div class="preprocess-has-toggle">
              <button
                type="button"
                class="preprocess-has-btn is-yes"
                :class="{ 'is-active': step.has === 1 }"
                :disabled="readonly"
                @click="setStepHas(index, 1)"
              >
                有
              </button>
              <button
                type="button"
                class="preprocess-has-btn is-no"
                :class="{ 'is-active': step.has === 0 }"
                :disabled="readonly"
                @click="setStepHas(index, 0)"
              >
                无
              </button>
            </div>
          </div>

          <ElDatePicker
            v-if="step.has === 1"
            v-model="step.finish_time"
            type="datetime"
            placeholder="选择时间"
            value-format="YYYY-MM-DD HH:mm:ss"
            format="YYYY-MM-DD HH:mm"
            class="preprocess-step-time"
            :disabled="readonly"
          />

          <div v-if="step.has === 1 && needsQtyInput(step)" class="preprocess-qty-row">
            <span class="preprocess-qty-label">可拆解产物数量：</span>
            <ElInput
              v-model="step.qty"
              placeholder="请输入"
              class="preprocess-qty-input"
              :disabled="readonly"
            />
            <span class="preprocess-qty-unit">个</span>
          </div>
        </div>
      </div>

      <div class="preprocess-finish-section">
        <div class="preprocess-finish-label">
          <ArtSvgIcon icon="ri:time-line" />
          预处理整体完成时间
        </div>
        <ElDatePicker
          v-model="overallFinishTime"
          type="datetime"
          placeholder="选择完成时间"
          value-format="YYYY-MM-DD HH:mm:ss"
          format="YYYY-MM-DD HH:mm"
          class="preprocess-finish-picker"
          :disabled="readonly"
        />
      </div>
    </div>

    <template #footer>
      <ElButton @click="dialogVisible = false">关闭</ElButton>
      <ElButton
        v-if="!readonly"
        type="success"
        :loading="submitting"
        :disabled="!canSubmit"
        @click="handleSubmit"
      >
        确认预处理完成
      </ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { ElMessage } from 'element-plus'
  import {
    fetchPlateDetail,
    fetchPlatePreprocess,
    fetchPreprocessStepList
  } from '@/api/recycle/plate'
  import {
    PREPROCESS_QTY_STEP_KEYS,
    type PlateItem,
    type PreprocessCheckedItem,
    type PreprocessStepOption
  } from '@/types/recycle/dismantle/work/plate'
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'

  /** 弹窗内单条工序状态 */
  interface StepState {
    step_key: string
    step_name: string
    has: 0 | 1 | null
    finish_time?: string
    qty?: string
  }

  interface Props {
    visible: boolean
    plateId?: number
    readonly?: boolean
  }

  interface Emits {
    (e: 'update:visible', value: boolean): void
    (e: 'success'): void
  }

  const props = withDefaults(defineProps<Props>(), {
    readonly: false
  })
  const emit = defineEmits<Emits>()

  // ----- 弹窗显隐 -----
  const dialogVisible = computed({
    get: () => props.visible,
    set: (val) => emit('update:visible', val)
  })

  // ----- 工序列表：有 / 无 -----
  const stepStates = ref<StepState[]>([])

  function formatNow() {
    const now = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
  }

  /** 电池、三元催化需要填写可拆解数量 */
  function needsQtyInput(step: Pick<StepState, 'step_key'>) {
    return (PREPROCESS_QTY_STEP_KEYS as readonly string[]).includes(step.step_key)
  }

  function setStepHas(index: number, has: 0 | 1) {
    if (props.readonly) return
    const step = stepStates.value[index]
    if (!step) return
    step.has = has
    if (has === 1 && !step.finish_time) {
      step.finish_time = formatNow()
    }
    if (has === 0) {
      step.finish_time = ''
      step.qty = ''
    }
  }

  const confirmedCount = computed(
    () => stepStates.value.filter((item) => item.has === 0 || item.has === 1).length
  )

  // ----- 整体完成时间 -----
  const overallFinishTime = ref('')

  // ----- 数据加载 -----
  const loading = ref(false)
  const plateItem = ref<PlateItem | null>(null)

  function parseQty(raw: unknown): string {
    if (raw === undefined || raw === null || raw === '') return ''
    return String(raw)
  }

  /** 兼容旧格式：字符串数组 / step_key+finish_time / key+time+qty */
  function parsePreprocessItems(raw: unknown): PreprocessCheckedItem[] {
    if (!raw) return []
    let data = raw
    if (typeof raw === 'string') {
      try {
        data = JSON.parse(raw)
      } catch {
        return []
      }
    }
    if (!Array.isArray(data)) return []
    return data.map((item) => {
      if (typeof item === 'string') {
        return { key: item, has: 1 as const, time: '' }
      }
      const record = item as Record<string, unknown>
      const key = String(record.key || record.step_key || '')
      const has: 0 | 1 = record.has === 0 ? 0 : 1
      const qtyNum =
        record.qty !== undefined && record.qty !== null && record.qty !== ''
          ? Number(record.qty)
          : undefined
      return {
        key,
        has,
        time: String(record.time || record.finish_time || ''),
        qty: Number.isFinite(qtyNum) ? qtyNum : undefined
      }
    })
  }

  function buildStepStates(steps: PreprocessStepOption[], saved: PreprocessCheckedItem[]) {
    const savedMap = new Map(saved.map((item) => [item.key, item]))
    return steps
      .slice()
      .sort((a, b) => (a.sort || 0) - (b.sort || 0))
      .map((step) => {
        const savedItem = savedMap.get(step.step_key)
        if (!savedItem) {
          return {
            step_key: step.step_key,
            step_name: step.step_name,
            has: null,
            finish_time: '',
            qty: ''
          }
        }
        return {
          step_key: step.step_key,
          step_name: step.step_name,
          has: savedItem.has,
          finish_time: savedItem.time || '',
          qty: parseQty(savedItem.qty)
        }
      })
  }

  async function loadData() {
    if (!props.plateId) return
    loading.value = true
    try {
      const [detail, steps] = await Promise.all([
        fetchPlateDetail(props.plateId),
        fetchPreprocessStepList()
      ])
      plateItem.value = detail
      const savedItems = parsePreprocessItems(detail.preprocess_items)
      stepStates.value = buildStepStates(steps || [], savedItems)
      overallFinishTime.value = detail.preprocess_finish_time || ''
    } finally {
      loading.value = false
    }
  }

  watch(
    () => [props.visible, props.plateId] as const,
    ([visible, plateId]) => {
      if (visible && plateId) {
        loadData()
      }
    }
  )

  // ----- 关闭重置 -----
  function handleClosed() {
    plateItem.value = null
    stepStates.value = []
    overallFinishTime.value = ''
  }

  // ----- 提交 -----
  const submitting = ref(false)

  /** 选了「有」时：时间必填；电池/三元催化数量必填 */
  const hasItemsValid = computed(() => {
    const hasItems = stepStates.value.filter((item) => item.has === 1)
    if (!hasItems.length) return true
    return hasItems.every((item) => {
      if (!item.finish_time?.trim()) return false
      if (needsQtyInput(item) && !item.qty?.trim()) return false
      return true
    })
  })

  const canSubmit = computed(() => {
    if (!confirmedCount.value) return false
    if (!overallFinishTime.value.trim()) return false
    return hasItemsValid.value
  })

  function buildCheckedItems(): PreprocessCheckedItem[] {
    return stepStates.value
      .filter((item) => item.has === 0 || item.has === 1)
      .map((item) => {
        const payload: PreprocessCheckedItem = {
          key: item.step_key,
          has: item.has as 0 | 1
        }
        if (item.has === 1) {
          payload.time = item.finish_time || formatNow()
          if (needsQtyInput(item)) {
            payload.qty = Number(item.qty?.trim() || 0)
          }
        }
        return payload
      })
  }

  async function handleSubmit() {
    if (!props.plateId) return

    const confirmed = stepStates.value.filter((item) => item.has === 0 || item.has === 1)
    if (!confirmed.length) {
      ElMessage.warning('请至少选择一项「有」或「无」')
      return
    }

    const invalidHas = confirmed.filter((item) => item.has === 1 && !item.finish_time?.trim())
    if (invalidHas.length) {
      ElMessage.warning(`请填写「${invalidHas[0].step_name}」的完成时间`)
      return
    }

    const invalidQty = confirmed.filter(
      (item) => item.has === 1 && needsQtyInput(item) && !item.qty?.trim()
    )
    if (invalidQty.length) {
      ElMessage.warning(`请填写「${invalidQty[0].step_name}」的可拆解产物数量`)
      return
    }

    if (!overallFinishTime.value.trim()) {
      ElMessage.warning('请填写预处理整体完成时间')
      return
    }

    submitting.value = true
    try {
      await fetchPlatePreprocess({
        plate_id: props.plateId,
        checked_items: buildCheckedItems(),
        finish_time: overallFinishTime.value.trim()
      })
      emit('success')
      dialogVisible.value = false
    } finally {
      submitting.value = false
    }
  }
</script>

<style scoped lang="scss">
  .work-preprocess-dialog {
    :deep(.el-dialog__header) {
      padding: 16px 20px 0;
      margin-right: 0;
    }

    :deep(.el-dialog__body) {
      padding: 16px 20px;
    }
  }

  .preprocess-dialog-title {
    font-size: 16px;
    font-weight: 600;
    color: var(--art-gray-900);
  }

  .preprocess-dialog-sub {
    margin-top: 4px;
    font-size: 12px;
    color: var(--art-gray-600);
  }

  .preprocess-progress {
    margin-bottom: 10px;
    font-size: 13px;
    color: #52c41a;
  }

  .preprocess-step-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    height: 500px;
    overflow-y: auto;
  }

  .preprocess-step-item {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 14px 16px;
    background: #fff;
    border: 2px solid #e8e8e8;
    border-radius: 8px;
    transition: all 0.2s;

    &.is-has {
      background: #f6ffed;
      border-color: #52c41a;
    }

    &.is-none {
      background: #f5f5f5;
      border-color: #e8e8e8;
    }
  }

  .preprocess-step-header {
    display: flex;
    gap: 12px;
    align-items: center;
    justify-content: space-between;
  }

  .preprocess-step-name {
    flex: 1;
    font-size: 14px;
    font-weight: 500;
    color: var(--art-gray-800);

    .is-has & {
      color: #389e0d;
    }
  }

  .preprocess-has-toggle {
    display: flex;
    flex-shrink: 0;
    gap: 8px;
  }

  .preprocess-has-btn {
    min-width: 44px;
    padding: 4px 14px;
    font-size: 13px;
    color: var(--art-gray-700);
    cursor: pointer;
    background: #fff;
    border: 1px solid #d9d9d9;
    border-radius: 4px;

    &:disabled {
      cursor: default;
    }

    &.is-yes.is-active {
      color: #fff;
      background: #52c41a;
      border-color: #52c41a;
    }

    &.is-no.is-active {
      color: #ff4d4f;
      background: #fff;
      border-color: #ff4d4f;
    }
  }

  .preprocess-step-time {
    width: 100%;

    :deep(.el-input__wrapper) {
      box-shadow: 0 0 0 1px #d9d9d9 inset;
    }
  }

  :deep(.el-date-editor.preprocess-step-time) {
    width: 100%;
  }

  .preprocess-qty-row {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .preprocess-qty-label {
    flex-shrink: 0;
    font-size: 13px;
    color: var(--art-gray-700);
  }

  .preprocess-qty-input {
    width: 96px;

    :deep(.el-input__wrapper) {
      box-shadow: 0 0 0 1px #d9d9d9 inset;
    }
  }

  .preprocess-qty-unit {
    font-size: 13px;
    color: var(--art-gray-700);
  }

  .preprocess-finish-section {
    padding-top: 16px;
    margin-top: 16px;
    border-top: 1px solid #f0f0f0;
  }

  .preprocess-finish-picker {
    width: 100%;
  }

  .preprocess-finish-label {
    display: flex;
    gap: 6px;
    align-items: center;
    margin-bottom: 8px;
    font-size: 13px;
    font-weight: 500;
    color: var(--art-gray-700);
  }
</style>
