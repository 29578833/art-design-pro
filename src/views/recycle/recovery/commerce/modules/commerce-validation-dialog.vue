<template>
  <ElDialog
    v-model="dialogVisible"
    width="600px"
    append-to-body
    :close-on-click-modal="false"
    class="commerce-validation-dialog"
  >
    <template #header>
      <div class="commerce-validation-title">
        <ArtSvgIcon icon="ri:close-circle-fill" class="commerce-validation-title-icon" />
        提交失败·资料不齐全
      </div>
    </template>

    <div v-if="row" class="commerce-validation-subtitle">
      无{{ row.hphm || row.clsbdh || '—' }} 以下功能模块存在缺失，请补充后重新提交
    </div>

    <div class="commerce-validation-body">
      <div
        v-if="missing.owner.fields.length || missing.owner.images.length"
        class="commerce-validation-section"
      >
        <div class="commerce-validation-section-header">
          <span class="commerce-validation-section-title">所有人信息</span>
          <span class="commerce-validation-section-count">
            缺失 {{ missing.owner.fields.length + missing.owner.images.length }} 项
          </span>
        </div>
        <div v-if="missing.owner.fields.length" class="commerce-validation-row">
          <span class="commerce-validation-label">缺失字段：</span>
          <span>{{ missing.owner.fields.join('、') }}</span>
        </div>
        <div v-if="missing.owner.images.length" class="commerce-validation-row">
          <span class="commerce-validation-label">缺失照片：</span>
          <span>{{ missing.owner.images.join('、') }}</span>
        </div>
      </div>

      <div
        v-if="missing.vehicle.fields.length || missing.vehicle.images.length"
        class="commerce-validation-section"
      >
        <div class="commerce-validation-section-header">
          <span class="commerce-validation-section-title">车辆信息</span>
          <span class="commerce-validation-section-count">
            缺失 {{ missing.vehicle.fields.length + missing.vehicle.images.length }} 项
          </span>
        </div>
        <div v-if="missing.vehicle.fields.length" class="commerce-validation-row">
          <span class="commerce-validation-label">缺失字段：</span>
          <span>{{ missing.vehicle.fields.join('、') }}</span>
        </div>
        <div v-if="missing.vehicle.images.length" class="commerce-validation-row">
          <span class="commerce-validation-label">缺失照片：</span>
          <span>{{ missing.vehicle.images.join('、') }}</span>
        </div>
      </div>

      <div
        v-if="missing.agent.fields.length || missing.agent.images.length"
        class="commerce-validation-section"
      >
        <div class="commerce-validation-section-header">
          <span class="commerce-validation-section-title">代理人信息</span>
          <span class="commerce-validation-section-count">
            缺失 {{ missing.agent.fields.length + missing.agent.images.length }} 项
          </span>
        </div>
        <div v-if="missing.agent.fields.length" class="commerce-validation-row">
          <span class="commerce-validation-label">缺失字段：</span>
          <span>{{ missing.agent.fields.join('、') }}</span>
        </div>
        <div v-if="missing.agent.images.length" class="commerce-validation-row">
          <span class="commerce-validation-label">缺失照片：</span>
          <span>{{ missing.agent.images.join('、') }}</span>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="commerce-validation-footer">
        <span class="commerce-validation-summary">共 {{ totalCount }} 项资料待补全</span>
        <div class="commerce-validation-actions">
          <ElButton @click="dialogVisible = false">关闭</ElButton>
          <ElButton type="primary" plain @click="emit('edit')">编辑档案</ElButton>
        </div>
      </div>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'
  import type { AcceptListItem } from '@/types/recycle/accept'
  import type { CommerceMissingData } from '../commerce-submit-validation'
  import { countCommerceMissing } from '../commerce-submit-validation'

  defineOptions({ name: 'CommerceValidationDialog' })

  interface Props {
    row: AcceptListItem | null
    missing: CommerceMissingData
  }

  const props = defineProps<Props>()
  const dialogVisible = defineModel<boolean>('visible', { required: true })
  const emit = defineEmits<{ edit: [] }>()

  const totalCount = computed(() => countCommerceMissing(props.missing))
</script>
