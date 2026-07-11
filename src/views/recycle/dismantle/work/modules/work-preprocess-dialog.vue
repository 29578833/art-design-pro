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
      <div class="preprocess-step-list">
        <div
          v-for="(step, index) in stepStates"
          :key="step.step_key"
          class="preprocess-step-item"
          :class="{ 'is-checked': step.checked, 'is-readonly': readonly }"
          @click="toggleStep(index)"
        >
          <div class="preprocess-step-check">
            <ArtSvgIcon v-if="step.checked" icon="ri:check-line" />
          </div>
          <span class="preprocess-step-name">{{ index + 1 }}. {{ step.step_name }}</span>
          <ElDatePicker
            v-if="step.checked"
            v-model="step.finish_time"
            type="datetime"
            placeholder="选择时间"
            value-format="YYYY-MM-DD HH:mm:ss"
            format="YYYY-MM-DD HH:mm"
            class="preprocess-step-time"
            :disabled="readonly"
            @click.stop
          />
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
  import type {
    PlateItem,
    PreprocessCheckedItem,
    PreprocessStepOption
  } from '@/types/recycle/plate'
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'

  interface StepState {
    step_key: string
    step_name: string
    checked: boolean
    finish_time?: string
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

  const dialogVisible = computed({
    get: () => props.visible,
    set: (val) => emit('update:visible', val)
  })

  const loading = ref(false)
  const submitting = ref(false)
  const plateItem = ref<PlateItem | null>(null)
  const stepStates = ref<StepState[]>([])
  const overallFinishTime = ref('')

  const canSubmit = computed(() => {
    const checked = stepStates.value.filter((item) => item.checked)
    return checked.length > 0 && overallFinishTime.value.trim()
  })

  function formatNow() {
    const now = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
  }

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
        return { step_key: item, finish_time: '' }
      }
      return {
        step_key: item.step_key || item.key || '',
        finish_time: item.finish_time || item.time || ''
      }
    })
  }

  function buildStepStates(steps: PreprocessStepOption[], saved: PreprocessCheckedItem[]) {
    const savedMap = new Map(saved.map((item) => [item.step_key, item.finish_time || '']))
    return steps
      .slice()
      .sort((a, b) => (a.sort || 0) - (b.sort || 0))
      .map((step) => ({
        step_key: step.step_key,
        step_name: step.step_name,
        checked: savedMap.has(step.step_key),
        finish_time: savedMap.get(step.step_key) || ''
      }))
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

  function toggleStep(index: number) {
    if (props.readonly) return
    const step = stepStates.value[index]
    if (!step) return
    step.checked = !step.checked
    if (step.checked && !step.finish_time) {
      step.finish_time = formatNow()
    }
  }

  async function handleSubmit() {
    if (!props.plateId) return
    const checkedItems: PreprocessCheckedItem[] = stepStates.value
      .filter((item) => item.checked)
      .map((item) => ({
        step_key: item.step_key,
        finish_time: item.finish_time || formatNow()
      }))

    if (!checkedItems.length) {
      ElMessage.warning('请至少勾选一项预处理工序')
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
        checked_items: checkedItems,
        finish_time: overallFinishTime.value.trim()
      })
      emit('success')
      dialogVisible.value = false
    } finally {
      submitting.value = false
    }
  }

  function handleClosed() {
    plateItem.value = null
    stepStates.value = []
    overallFinishTime.value = ''
  }

  watch(
    () => [props.visible, props.plateId] as const,
    ([visible, plateId]) => {
      if (visible && plateId) {
        loadData()
      }
    }
  )
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

  .preprocess-step-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    height: 500px;
    overflow-y: auto;
  }

  .preprocess-step-item {
    display: flex;
    gap: 12px;
    align-items: center;
    padding: 14px 16px;
    cursor: pointer;
    border: 2px solid #e8e8e8;
    border-radius: 8px;
    transition: all 0.2s;

    &.is-checked {
      background: #f6ffed;
      border-color: #52c41a;
    }

    &.is-readonly {
      cursor: default;
    }
  }

  .preprocess-step-check {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    font-size: 14px;
    color: #fff;
    border: 2px solid #d9d9d9;
    border-radius: 50%;

    .is-checked & {
      background: #52c41a;
      border-color: #52c41a;
    }
  }

  .preprocess-step-name {
    flex: 1;
    font-size: 14px;
    font-weight: 500;
    color: var(--art-gray-800);

    .is-checked & {
      color: #389e0d;
    }
  }

  .preprocess-step-time {
    width: 180px;

    :deep(.el-input__wrapper) {
      box-shadow: 0 0 0 1px #d9d9d9 inset;
    }
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
