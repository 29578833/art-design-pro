<template>
  <ElDialog
    v-model="dialogVisible"
    width="590px"
    align-center
    destroy-on-close
    :show-close="true"
    class="entry-confirm-dialog"
    style="padding: 0 !important"
    @closed="handleClosed"
  >
    <template #header>
      <div class="entry-dialog-header">
        <div>
          <div class="entry-dialog-title">确认原料入库</div>
          <div class="entry-dialog-subtitle">
            {{ entryItem?.order_no || '—' }} · {{ entryItem?.plate_no || '—' }}
          </div>
        </div>
      </div>
    </template>

    <div v-if="entryItem" class="entry-confirm-body">
      <div class="entry-tip">
        查验通过后将车辆作为原料资产正式入库，分配仓库和库位，状态变为"待领料"。
      </div>

      <div v-if="weighNet > 0" class="entry-weigh-card">
        <span class="entry-weigh-label">过磅净重</span>
        <span class="entry-weigh-value">
          {{ weighNet }} kg
          <span class="entry-weigh-sub">
            （毛{{ weighGross || '—' }} / 皮{{ weighTare || '—' }}）
          </span>
        </span>
      </div>

      <ElForm
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-position="top"
        class="entry-form"
      >
        <ElFormItem prop="warehouse_area_id">
          <template #label>
            <span class="entry-field-label">入库仓库</span>
          </template>
          <ElSelect
            v-model="formData.warehouse_area_id"
            placeholder="请选择仓库"
            class="entry-field-control"
            @change="handleAreaChange"
          >
            <ElOption
              v-for="area in warehouseAreas"
              :key="area.id"
              :label="area.area_name"
              :value="area.id"
            />
          </ElSelect>
        </ElFormItem>

        <ElFormItem prop="location_id">
          <template #label>
            <span class="entry-field-label">库位编码</span>
          </template>
          <ElSelect
            v-model="formData.location_id"
            :placeholder="locationPlaceholder"
            :disabled="!formData.warehouse_area_id || loadingLocations"
            :loading="loadingLocations"
            class="entry-field-control"
            @change="handleLocationChange"
          >
            <ElOption
              v-for="loc in locationOptions"
              :key="loc.id"
              :label="getLocationLabel(loc)"
              :value="loc.id"
              :disabled="loc.status === 1"
            />
          </ElSelect>
        </ElFormItem>

        <ElFormItem>
          <template #label>
            <span class="entry-field-label">入库单号（系统生成）</span>
          </template>
          <div class="entry-no-preview">{{ previewEntryNo }}</div>
        </ElFormItem>

        <ElFormItem>
          <template #label>
            <span class="entry-field-label">入厂照片</span>
          </template>
          <div
            class="entry-photo-upload w-full"
            :class="{ 'is-uploading': uploadingPhoto }"
            @click="triggerPhotoUpload"
          >
            <template v-if="photoList.length">
              <div class="entry-photo-preview-list" @click.stop>
                <div
                  v-for="(url, index) in photoList"
                  :key="`${url}-${index}`"
                  class="entry-photo-thumb"
                >
                  <button type="button" class="entry-photo-delete" @click="removePhoto(index)">
                    <ArtSvgIcon icon="ri:close-line" />
                  </button>
                  <ElImage
                    :src="url"
                    :preview-src-list="photoList"
                    :initial-index="index"
                    fit="cover"
                    class="entry-photo-thumb-image"
                    preview-teleported
                  />
                </div>
              </div>
              <div class="entry-photo-upload-hint">点击继续上传（至少1张）</div>
            </template>
            <template v-else>
              <ArtSvgIcon icon="ri:camera-line" class="entry-photo-upload-icon" />
              <p class="entry-photo-upload-text">点击上传车辆入库照片（至少1张）</p>
            </template>
          </div>
          <input
            ref="photoInputRef"
            type="file"
            accept="image/*"
            class="entry-photo-input"
            @change="handlePhotoChange"
          />
        </ElFormItem>
      </ElForm>
    </div>

    <template #footer>
      <div class="entry-dialog-footer">
        <ElButton class="entry-btn-cancel" @click="dialogVisible = false">取消</ElButton>
        <ElButton
          class="entry-btn-confirm"
          type="primary"
          :loading="submitting"
          @click="handleSubmit"
        >
          {{ submitting ? '确认中…' : '确认入库' }}
        </ElButton>
      </div>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import type { FormInstance, FormRules } from 'element-plus'
  import {
    confirmWarehouseEntry,
    fetchWarehouseAreas,
    fetchWarehouseLocations
  } from '@/api/recycle/warehouse'
  import { uploadFileGetUrl } from '@/api/upload'
  import type {
    WarehouseAreaOption,
    WarehouseEntryItem,
    WarehouseLocationOption
  } from '@/types/recycle/warehouse'
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'

  interface Props {
    visible: boolean
    entryItem: WarehouseEntryItem | null
  }

  interface Emits {
    (e: 'update:visible', value: boolean): void
    (e: 'success'): void
  }

  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()

  const formRef = ref<FormInstance>()
  const warehouseAreas = ref<WarehouseAreaOption[]>([])
  const locationOptions = ref<WarehouseLocationOption[]>([])
  const loadingLocations = ref(false)
  const submitting = ref(false)
  const uploadingPhoto = ref(false)
  const photoInputRef = ref<HTMLInputElement>()
  const photoList = ref<string[]>([])

  const formData = reactive({
    warehouse_area_id: undefined as number | undefined,
    warehouse_area: '',
    location_id: undefined as number | undefined,
    location_code: ''
  })

  const rules: FormRules = {
    warehouse_area_id: [{ required: true, message: '请选择入库仓库', trigger: 'change' }],
    location_id: [{ required: true, message: '请选择库位编码', trigger: 'change' }]
  }

  const dialogVisible = computed({
    get: () => props.visible,
    set: (val) => emit('update:visible', val)
  })

  const weighNet = computed(() => Number(props.entryItem?.weigh_net || 0))
  const weighGross = computed(() =>
    Number(props.entryItem?.weigh_gross || props.entryItem?.gross_weight || 0)
  )
  const weighTare = computed(() =>
    Number(props.entryItem?.weigh_tare || props.entryItem?.tare_weight || 0)
  )

  const previewEntryNo = computed(() => {
    const now = new Date()
    const date = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
    return `RK${date}${String(Date.now()).slice(-4)}`
  })

  const locationPlaceholder = computed(() => {
    if (!formData.warehouse_area_id) return '请先选择入库仓库'
    if (loadingLocations.value) return '加载库位中…'
    if (!locationOptions.value.length) return '该仓库暂无可用库位'
    return '请选择库位编码'
  })

  function getLocationLabel(loc: WarehouseLocationOption): string {
    const code = loc.location_no || '—'
    const suffix = loc.status === 1 ? '（已占用）' : ''
    if (loc.area) return `${loc.area}-${code}${suffix}`
    return `${code}${suffix}`
  }

  async function loadWarehouseAreas() {
    try {
      warehouseAreas.value = (await fetchWarehouseAreas()) || []
    } catch {
      warehouseAreas.value = []
    }
  }

  async function loadLocations(areaId: number) {
    loadingLocations.value = true
    locationOptions.value = []
    try {
      locationOptions.value = await fetchWarehouseLocations(areaId)
    } catch {
      locationOptions.value = []
    } finally {
      loadingLocations.value = false
    }
  }

  async function handleAreaChange(areaId: number) {
    const area = warehouseAreas.value.find((item) => item.id === areaId)
    formData.warehouse_area = area?.area_name || ''
    formData.location_id = undefined
    formData.location_code = ''
    if (areaId) {
      await loadLocations(areaId)
    } else {
      locationOptions.value = []
    }
  }

  function handleLocationChange(locationId: number) {
    const loc = locationOptions.value.find((item) => item.id === locationId)
    if (!loc) {
      formData.location_code = ''
      return
    }
    formData.location_code = loc.area
      ? `${loc.area}-${loc.location_no || ''}`
      : loc.location_no || ''
  }

  function resetForm() {
    formData.warehouse_area_id = undefined
    formData.warehouse_area = ''
    formData.location_id = undefined
    formData.location_code = ''
    locationOptions.value = []
    photoList.value = []
    formRef.value?.clearValidate()
  }

  function triggerPhotoUpload() {
    if (uploadingPhoto.value) return
    photoInputRef.value?.click()
  }

  async function handlePhotoChange(event: Event) {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]
    input.value = ''
    if (!file) return

    uploadingPhoto.value = true
    try {
      const url = await uploadFileGetUrl(file, { showSuccessMessage: true })
      if (url) photoList.value.push(url)
    } catch {
      // 错误已由 http 拦截器处理
    } finally {
      uploadingPhoto.value = false
    }
  }

  function removePhoto(index: number) {
    photoList.value.splice(index, 1)
  }

  async function handleSubmit() {
    if (!props.entryItem?.vehicle_id) return
    const valid = await formRef.value?.validate().catch(() => false)
    if (!valid) return

    submitting.value = true
    try {
      await confirmWarehouseEntry({
        vehicle_id: props.entryItem.vehicle_id,
        warehouse_area_id: formData.warehouse_area_id,
        warehouse_area: formData.warehouse_area,
        location: String(formData.location_id),
        location_code: formData.location_code,
        images: photoList.value.join(',')
      })
      emit('success')
      dialogVisible.value = false
    } finally {
      submitting.value = false
    }
  }

  function handleClosed() {
    resetForm()
  }

  watch(
    () => props.visible,
    (visible) => {
      if (visible) {
        resetForm()
        loadWarehouseAreas()
      }
    }
  )
</script>

<style scoped lang="scss">
  .entry-dialog-title {
    font-size: 16px;
    font-weight: 600;
    line-height: 24px;
    color: #111827;
  }

  .entry-dialog-subtitle {
    margin-top: 2px;
    font-size: 12px;
    line-height: 16px;
    color: #9ca3af;
  }

  .entry-confirm-body {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .entry-tip {
    padding: 12px;
    font-size: 14px;
    line-height: 1.5;
    color: #1890ff;
    background: #e6f7ff;
    border: 1px solid #91d5ff;
    border-radius: 8px;
  }

  .entry-weigh-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px;
    background: #f9fafb;
    border-radius: 8px;
  }

  .entry-weigh-label {
    font-size: 14px;
    color: #6b7280;
  }

  .entry-weigh-value {
    font-size: 14px;
    font-weight: 600;
    color: #1890ff;
  }

  .entry-weigh-sub {
    margin-left: 4px;
    font-size: 12px;
    font-weight: 400;
    color: #9ca3af;
  }

  .entry-form {
    display: flex;
    flex-direction: column;
    gap: 16px;

    :deep(.el-form-item) {
      margin-bottom: 0;
    }

    :deep(.el-form-item__label) {
      height: 26px !important;
      padding: 0;
      line-height: 32px !important;
    }
  }

  .entry-field-label {
    font-size: 14px;
    line-height: 16px;
    color: #4b5563;
  }

  .entry-required {
    color: #ff4d4f;
  }

  .entry-field-control {
    width: 100%;

    :deep(.el-select__wrapper),
    :deep(.el-input__wrapper) {
      min-height: 36px;
      font-size: 14px;
      border-radius: 4px;
      box-shadow: 0 0 0 1px #d1d5db inset;
    }

    :deep(.el-select__wrapper.is-focused),
    :deep(.el-input__wrapper.is-focus) {
      box-shadow: 0 0 0 1px #1890ff inset;
    }
  }

  .entry-no-preview {
    width: 100%;
    padding: 8px 12px;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 12px;
    line-height: 20px;
    color: #6b7280;
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 4px;
  }

  .entry-photo-upload {
    padding: 20px;
    text-align: center;
    cursor: pointer;
    border: 2px dashed #e5e7eb;
    border-radius: 8px;
    transition: border-color 0.2s;

    &:hover {
      border-color: #1890ff;
    }

    &.is-uploading {
      pointer-events: none;
      opacity: 0.6;
    }
  }

  .entry-photo-upload-icon {
    display: block;
    margin: 0 auto 4px;
    font-size: 24px;
    color: #d1d5db;
  }

  .entry-photo-upload-text,
  .entry-photo-upload-hint {
    margin: 0;
    font-size: 12px;
    line-height: 16px;
    color: #9ca3af;
  }

  .entry-photo-upload-hint {
    margin-top: 8px;
  }

  .entry-photo-preview-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    justify-content: center;
  }

  .entry-photo-thumb {
    position: relative;
    width: 72px;
    height: 72px;
    overflow: hidden;
    border-radius: 6px;
  }

  .entry-photo-thumb-image {
    width: 100%;
    height: 100%;
  }

  .entry-photo-delete {
    position: absolute;
    top: 4px;
    right: 4px;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    padding: 0;
    font-size: 12px;
    color: #fff;
    cursor: pointer;
    background: rgb(0 0 0 / 45%);
    border: none;
    border-radius: 50%;
  }

  .entry-photo-input {
    display: none;
  }

  .entry-dialog-footer {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
  }

  .entry-btn-cancel {
    height: 36px;
    padding: 0 16px;
    font-size: 14px;
    color: #4b5563;
    background: #fff;
    border: 1px solid #d1d5db;
    border-radius: 4px;

    &:hover {
      color: #4b5563;
      background: #f9fafb;
      border-color: #d1d5db;
    }
  }

  .entry-btn-confirm {
    height: 36px;
    padding: 0 20px;
    font-size: 14px;
    font-weight: 500;
    background: #1890ff;
    border-color: #1890ff;
    border-radius: 4px;

    &:hover {
      background: #096dd9;
      border-color: #096dd9;
    }
  }
</style>

<style lang="scss">
  .entry-confirm-dialog {
    .el-dialog__header {
      padding: 16px 24px;
      margin-right: 0;
      border-bottom: 1px solid #e5e7eb;
    }

    .el-dialog__body {
      padding: 20px 24px;
    }

    .el-dialog__footer {
      padding: 16px 24px;
      border-top: 1px solid #e5e7eb;
    }

    .el-dialog__headerbtn {
      top: 16px;
      right: 20px;
      width: 28px;
      height: 28px;
    }
  }
</style>
