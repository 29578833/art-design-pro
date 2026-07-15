<template>
  <ElDialog
    v-model="dialogVisible"
    width="820px"
    align-center
    append-to-body
    :show-close="false"
    :close-on-click-modal="false"
    style="padding: 0 !important"
    class="commerce-submit-fail-dialog"
  >
    <div class="csf-header">
      <div class="csf-header-main">
        <div class="csf-header-icon">
          <ArtSvgIcon icon="ri:error-warning-line" />
        </div>
        <div>
          <h3 class="csf-header-title">提交失败 · 资料不齐全</h3>
          <p v-if="row" class="csf-header-desc">
            {{ row.clsbdh || '—' }} · {{ row.hphm || '—' }}
            以下功能模块存在缺失，请补全后重新提交
          </p>
        </div>
      </div>
      <button type="button" class="csf-header-close" @click="dialogVisible = false">
        <ArtSvgIcon icon="ri:close-line" />
      </button>
    </div>

    <div class="csf-body">
      <div class="csf-alert">
        <ArtSvgIcon icon="ri:error-warning-line" class="csf-alert-icon" />
        <span>请补全以下功能模块中标注的缺失字段和照片信息，确保所有数据完整后再提交商务部。</span>
      </div>

      <div v-for="item in moduleList" :key="item.module" class="csf-module">
        <div class="csf-module-head">
          <span class="csf-module-title">{{ item.module }}</span>
          <span class="csf-module-count">
            缺失 {{ item.missingFields.length + item.missingPhotos.length }} 项
          </span>
        </div>
        <div class="csf-module-body">
          <div v-if="item.missingFields.length" class="csf-missing-group">
            <div class="csf-missing-label">缺失字段：</div>
            <div class="csf-tag-list">
              <span v-for="field in item.missingFields" :key="field" class="csf-tag csf-tag-field">
                <ArtSvgIcon icon="ri:error-warning-line" />
                {{ field }}
              </span>
            </div>
          </div>
          <div v-if="item.missingPhotos.length" class="csf-missing-group">
            <div class="csf-missing-label">缺失照片：</div>
            <div class="csf-tag-list">
              <span v-for="photo in item.missingPhotos" :key="photo" class="csf-tag csf-tag-photo">
                <ArtSvgIcon icon="ri:camera-line" />
                {{ photo }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="csf-footer">
      <div class="csf-footer-tip">共 {{ totalCount }} 项资料待补全</div>
      <div class="csf-footer-actions">
        <button type="button" class="csf-btn csf-btn-close" @click="dialogVisible = false"
          >关闭</button
        >
        <button type="button" class="csf-btn csf-btn-edit" @click="handleEdit">
          <ArtSvgIcon icon="ri:edit-line" />
          编辑档案
        </button>
        <button
          type="button"
          class="csf-btn csf-btn-submit"
          :disabled="submitting"
          @click="handleSubmit"
        >
          <ArtSvgIcon :icon="submitting ? 'ri:loader-4-line' : 'ri:send-plane-line'" />
          {{ submitting ? '提交中…' : '提交商务部' }}
        </button>
      </div>
    </div>
  </ElDialog>
</template>

<script setup lang="ts">
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'
  import type { AcceptListItem } from '@/types/recycle/accept'
  import type { CommerceMissingData } from '../commerce-submit-validation'
  import { countCommerceMissing } from '../commerce-submit-validation'
  import './commerce-validation-dialog.scss'

  defineOptions({ name: 'CommerceValidationDialog' })

  interface Props {
    row: AcceptListItem | null
    missing: CommerceMissingData
    submitting?: boolean
  }

  const props = withDefaults(defineProps<Props>(), {
    submitting: false
  })
  const dialogVisible = defineModel<boolean>('visible', { required: true })
  const emit = defineEmits<{ edit: []; submit: [] }>()

  const totalCount = computed(() => countCommerceMissing(props.missing))

  const moduleList = computed(() =>
    [
      {
        module: '所有人信息',
        missingFields: props.missing.owner.fields,
        missingPhotos: props.missing.owner.images
      },
      {
        module: '车辆信息',
        missingFields: props.missing.vehicle.fields,
        missingPhotos: props.missing.vehicle.images
      },
      {
        module: '代理人信息',
        missingFields: props.missing.agent.fields,
        missingPhotos: props.missing.agent.images
      }
    ].filter((item) => item.missingFields.length + item.missingPhotos.length > 0)
  )

  function handleEdit() {
    dialogVisible.value = false
    emit('edit')
  }

  function handleSubmit() {
    emit('submit')
  }
</script>
