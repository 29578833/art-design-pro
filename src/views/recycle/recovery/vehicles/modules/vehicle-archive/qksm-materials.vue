<template>
  <div class="ae-qksm">
    <div class="ae-qksm-head">
      <div class="ae-qksm-head-left">
        <span class="ae-qksm-head-icon-wrap">
          <ArtSvgIcon icon="ri:folder-image-line" class="ae-qksm-head-icon" />
        </span>
        <div class="ae-qksm-head-text">
          <div class="ae-qksm-title-row">
            <span class="ae-qksm-title">非车管情况材料上传</span>
            <span class="ae-qksm-tag">非车管（场内）专用</span>
          </div>
          <span class="ae-qksm-limit">支持 JPG / PNG，单张 ≤10MB</span>
        </div>
      </div>
    </div>

    <div class="ae-qksm-body">
      <div class="ae-qksm-col">
        <div class="ae-qksm-proof-head">
          <div class="ae-qksm-proof-head-label">
            非车管情况说明
            <span class="ae-qksm-req">必传</span>
          </div>
        </div>
        <div
          class="ae-qksm-note mt-3"
          :class="{ done: !!materials.cqksmzp, disabled: readonly }"
          @click="!readonly && !materials.cqksmzp && triggerNotePick()"
          @dragover.prevent="onNoteDragOver"
          @dragleave="noteDragging = false"
          @drop.prevent="onNoteDrop"
        >
          <template v-if="materials.cqksmzp">
            <ElImage
              :src="materials.cqksmzp"
              fit="contain"
              loading="lazy"
              class="ae-qksm-note-img"
              :preview-src-list="[materials.cqksmzp]"
              preview-teleported
              hide-on-click-modal
            />
            <button
              v-if="!readonly"
              type="button"
              class="ae-qksm-del"
              title="删除"
              @click.stop="materials.cqksmzp = ''"
            >
              <ArtSvgIcon icon="ri:close-line" />
            </button>
          </template>
          <div v-else class="ae-qksm-note-empty" :class="{ drag: noteDragging }">
            <span class="ae-qksm-note-icon">
              <ArtSvgIcon icon="ri:upload-cloud-2-line" />
            </span>
            <span class="ae-qksm-note-main">单击或拖拽照片至此上传</span>
            <span class="ae-qksm-note-sub">必传 · 情况说明图片</span>
          </div>
        </div>
        <input
          ref="noteInputRef"
          type="file"
          accept="image/jpeg,image/png,.jpg,.jpeg,.png"
          style="display: none"
          @change="onNoteFileChange"
        />
      </div>

      <div class="ae-qksm-col">
        <div class="ae-qksm-proof-head">
          <div class="ae-qksm-col-label">
            证明材料
            <span class="ae-qksm-opt">选填，可多选</span>
          </div>
          <ElDropdown v-if="!readonly" trigger="click" @command="pickProof">
            <button type="button" class="ae-qksm-upload-btn">
              <ArtSvgIcon icon="ri:add-line" />
              点击上传
              <ArtSvgIcon icon="ri:arrow-down-s-line" class="ae-qksm-upload-caret" />
            </button>
            <template #dropdown>
              <ElDropdownMenu>
                <ElDropdownItem
                  v-for="item in proofOptions"
                  :key="item.field"
                  :command="item.field"
                >
                  {{ item.label }}
                </ElDropdownItem>
              </ElDropdownMenu>
            </template>
          </ElDropdown>
        </div>

        <div class="ae-qksm-proof" :class="{ empty: !hasProof }">
          <template v-if="hasProof">
            <div v-for="item in proofOptions" :key="item.field" class="ae-qksm-proof-group">
              <template v-if="materials[item.field].length">
                <div class="ae-qksm-proof-label">
                  <span>{{ item.label }}</span>
                  <span class="ae-qksm-proof-count">{{ materials[item.field].length }} 张</span>
                </div>
                <div class="ae-qksm-proof-grid">
                  <div
                    v-for="(url, index) in materials[item.field]"
                    :key="`${item.field}-${url}-${index}`"
                    class="ae-qksm-thumb"
                  >
                    <ElImage
                      :src="url"
                      fit="contain"
                      loading="lazy"
                      class="ae-qksm-thumb-img"
                      :preview-src-list="materials[item.field]"
                      :initial-index="index"
                      preview-teleported
                      hide-on-click-modal
                    />
                    <button
                      v-if="!readonly"
                      type="button"
                      class="ae-qksm-del"
                      title="删除"
                      @click.stop="removeProof(item.field, index)"
                    >
                      <ArtSvgIcon icon="ri:close-line" />
                    </button>
                  </div>
                </div>
              </template>
            </div>
          </template>
          <div v-else class="ae-qksm-proof-empty">
            <ArtSvgIcon icon="ri:image-add-line" class="ae-qksm-proof-empty-icon" />
            <span>暂无证明材料</span>
            <span class="ae-qksm-proof-empty-sub">点击右上角按类型上传</span>
          </div>
          <div class="ae-qksm-proof-hint">可按需选择身份证明 / 产权证明 / 委托代办等材料分别上传</div>
        </div>
        <input
          ref="proofInputRef"
          type="file"
          accept="image/jpeg,image/png,.jpg,.jpeg,.png"
          multiple
          style="display: none"
          @change="onProofFileChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { fetchAcceptUploadImage } from '@/api/recycle/accept'
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'
  import { ElMessage } from 'element-plus'
  import { QKSM_MAX_FILE_SIZE, QKSM_NOTE_LX, QKSM_PROOF_OPTIONS } from './archive-constants'
  import type { ArchiveQksmMaterials, ArchiveQksmProofField } from './types'

  defineOptions({ name: 'VehicleArchiveQksmMaterials' })

  const props = defineProps<{
    /** 车辆 ID。 */
    vehicleId: number
    /** 是否只读。 */
    readonly: boolean
  }>()

  const materials = defineModel<ArchiveQksmMaterials>('materials', { required: true })

  const proofOptions = QKSM_PROOF_OPTIONS
  const noteInputRef = ref<HTMLInputElement | null>(null)
  const proofInputRef = ref<HTMLInputElement | null>(null)
  const noteDragging = ref(false)
  const pendingProofField = ref<ArchiveQksmProofField>('sfzmzp')
  const uploading = ref(false)

  const hasProof = computed(
    () =>
      materials.value.sfzmzp.length +
        materials.value.cqzmzp.length +
        materials.value.wtdbzp.length >
      0
  )

  const lxMap: Record<ArchiveQksmProofField, string> = {
    sfzmzp: '81',
    cqzmzp: '82',
    wtdbzp: '83'
  }

  function isAllowedImage(file: File) {
    const type = file.type.toLowerCase()
    const name = file.name.toLowerCase()
    const okType = type === 'image/jpeg' || type === 'image/png' || type === 'image/jpg'
    const okExt = name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.png')
    return okType || okExt
  }

  function validateFile(file: File) {
    if (!isAllowedImage(file)) {
      ElMessage.warning('仅支持 JPG / PNG 图片')
      return false
    }
    if (file.size > QKSM_MAX_FILE_SIZE) {
      ElMessage.warning('单张图片不能超过 10MB')
      return false
    }
    return true
  }

  function triggerNotePick() {
    if (props.readonly || uploading.value) return
    noteInputRef.value?.click()
  }

  function pickProof(field: ArchiveQksmProofField) {
    if (props.readonly || uploading.value) return
    pendingProofField.value = field
    if (proofInputRef.value) proofInputRef.value.value = ''
    proofInputRef.value?.click()
  }

  async function uploadOne(file: File, field: string, lx: string) {
    return fetchAcceptUploadImage({
      file,
      vehicle_id: props.vehicleId,
      field,
      lx
    })
  }

  async function onNoteFileChange(event: Event) {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]
    input.value = ''
    if (!file) return
    await uploadNote(file)
  }

  function onNoteDragOver() {
    if (props.readonly || materials.value.cqksmzp) return
    noteDragging.value = true
  }

  async function onNoteDrop(event: DragEvent) {
    noteDragging.value = false
    if (props.readonly || materials.value.cqksmzp) return
    const file = event.dataTransfer?.files?.[0]
    if (file) await uploadNote(file)
  }

  async function uploadNote(file: File) {
    if (!validateFile(file) || uploading.value) return
    uploading.value = true
    try {
      const url = await uploadOne(file, 'cqksmzp', QKSM_NOTE_LX)
      if (url) materials.value.cqksmzp = url
    } finally {
      uploading.value = false
    }
  }

  async function onProofFileChange(event: Event) {
    const input = event.target as HTMLInputElement
    const files = Array.from(input.files || [])
    input.value = ''
    if (!files.length || props.readonly) return
    const field = pendingProofField.value
    uploading.value = true
    try {
      for (const file of files) {
        if (!validateFile(file)) continue
        const url = await uploadOne(file, field, lxMap[field])
        if (url) materials.value[field] = [...materials.value[field], url]
      }
    } finally {
      uploading.value = false
    }
  }

  function removeProof(field: ArchiveQksmProofField, index: number) {
    materials.value[field] = materials.value[field].filter((_, i) => i !== index)
  }
</script>
