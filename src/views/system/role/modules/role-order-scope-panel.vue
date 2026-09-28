<template>
  <div class="order-scope-panel">
    <div class="scope-head">
      <span class="scope-title">订单数据范围设置</span>
      <span class="scope-desc">控制该角色可访问的正式回收订单数据边界</span>
    </div>

    <div class="scope-row">
      <div class="scope-label">查看范围</div>
      <div class="scope-content">
        <ElRadioGroup
          :model-value="modelValue.view_scope"
          class="scope-options"
          @change="(value) => handleScopeChange('view', value)"
        >
          <ElRadio value="all">全部</ElRadio>
          <ElRadio value="assigned">指定员工</ElRadio>
          <ElRadio value="self">仅看自己</ElRadio>
        </ElRadioGroup>

        <div v-if="modelValue.view_scope === 'assigned'" class="scope-picked">
          <ElButton class="scope-pick-btn" plain @click="emit('pick', 'view')">
            <ArtSvgIcon icon="ri:user-line" />
            选择员工
          </ElButton>
          <span v-if="viewEmployeeNames.length" class="scope-names">
            已选 {{ viewEmployeeNames.length }} 人：{{ viewEmployeeNames.join('、') }}
          </span>
          <span v-else class="scope-empty">请选择至少一名员工</span>
        </div>
        <div v-else-if="modelValue.view_scope === 'self'" class="scope-hint">
          仅能查看自己创建的回收订单数据
        </div>
        <div v-else class="scope-hint">可查看所有员工创建的回收订单数据</div>
      </div>
    </div>

    <div class="scope-row">
      <div class="scope-label">编辑范围</div>
      <div class="scope-content">
        <ElRadioGroup
          :model-value="modelValue.edit_scope"
          class="scope-options"
          @change="(value) => handleScopeChange('edit', value)"
        >
          <ElRadio value="all">全部</ElRadio>
          <ElRadio value="assigned">指定员工</ElRadio>
          <ElRadio value="self">仅看自己</ElRadio>
        </ElRadioGroup>

        <div v-if="modelValue.edit_scope === 'assigned'" class="scope-picked">
          <ElButton class="scope-pick-btn" plain @click="emit('pick', 'edit')">
            <ArtSvgIcon icon="ri:user-line" />
            选择员工
          </ElButton>
          <span v-if="editEmployeeNames.length" class="scope-names">
            已选 {{ editEmployeeNames.length }} 人：{{ editEmployeeNames.join('、') }}
          </span>
          <span v-else class="scope-empty">请选择至少一名员工</span>
        </div>
        <div v-else-if="modelValue.edit_scope === 'all'" class="scope-hint">
          可编辑 / 查看所有员工创建的回收订单数据
        </div>
        <div v-else-if="modelValue.edit_scope === 'self'" class="scope-hint">
          仅能编辑 / 查看自己创建的回收订单数据
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import type {
    OrderDataScope,
    OrderDataScopeConfig,
    OrderDataScopeDimension
  } from '@/types/recycle/system/system'
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'

  const props = defineProps<{
    modelValue: OrderDataScopeConfig
    viewEmployeeNames: string[]
    editEmployeeNames: string[]
  }>()

  const emit = defineEmits<{
    'update:modelValue': [value: OrderDataScopeConfig]
    pick: [dimension: OrderDataScopeDimension]
  }>()

  function handleScopeChange(
    dimension: OrderDataScopeDimension,
    value: string | number | boolean | undefined
  ) {
    const scope = String(value || 'all') as OrderDataScope
    if (dimension === 'view') {
      emit('update:modelValue', {
        ...props.modelValue,
        view_scope: scope,
        view_employees: scope === 'assigned' ? props.modelValue.view_employees : []
      })
      return
    }

    emit('update:modelValue', {
      ...props.modelValue,
      edit_scope: scope,
      edit_employees: scope === 'assigned' ? props.modelValue.edit_employees : []
    })
  }
</script>

<style scoped lang="scss">
  .order-scope-panel {
    background: #f8fbff;
    border-bottom: 1px solid #e5e7eb;
  }

  .scope-head {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: baseline;
    padding: 12px 16px 12px 48px;
    background: #eef5ff;
    border-top: 1px solid #d6e9ff;
    border-bottom: 1px solid #d6e9ff;
  }

  .scope-title {
    font-size: 13px;
    font-weight: 600;
    color: #1677c8;
  }

  .scope-desc {
    font-size: 12px;
    color: #7a8ca6;
  }

  .scope-row {
    display: flex;
    gap: 12px;
    align-items: flex-start;
    padding: 14px 16px 14px 48px;

    & + .scope-row {
      border-top: 1px solid #edf2f7;
    }
  }

  .scope-label {
    flex-shrink: 0;
    width: 72px;
    font-size: 13px;
    line-height: 28px;
    color: #4b5563;
  }

  .scope-content {
    flex: 1;
    min-width: 0;
  }

  .scope-options {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 18px;

    :deep(.el-radio) {
      height: 28px;
      margin-right: 0;
    }

    :deep(.el-radio__label) {
      font-size: 13px;
      color: #374151;
    }
  }

  .scope-picked {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    align-items: center;
    margin-top: 8px;
  }

  .scope-pick-btn {
    color: #1677c8;
    background: var(--el-bg-color);
    border-color: #91d5ff;

    &:hover {
      color: #1677c8;
      background: #f0f8ff;
      border-color: #1677c8;
    }
  }

  .scope-names,
  .scope-empty,
  .scope-hint {
    font-size: 12px;
    line-height: 20px;
  }

  .scope-names {
    color: #4b5563;
    overflow-wrap: anywhere;
  }

  .scope-empty {
    color: #d97706;
  }

  .scope-hint {
    margin-top: 5px;
    color: #7a8ca6;
  }

  @media (width <= 900px) {
    .scope-head,
    .scope-row {
      padding-left: 16px;
    }

    .scope-row {
      flex-direction: column;
      gap: 4px;
    }
  }
</style>
