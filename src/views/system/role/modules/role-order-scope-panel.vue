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
    margin: 8px 16px 14px 32px;
    overflow: hidden;
    background: #fff;
    border: 1px solid #bad9ff;
    border-radius: 6px;
  }

  .scope-head {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
    padding: 10px 16px;
    background: #e9f4ff;
    border-bottom: 1px solid #bad9ff;
  }

  .scope-title {
    font-size: 14px;
    font-weight: 600;
    line-height: 20px;
    color: #1d84ff;
  }

  .scope-desc {
    display: inline-flex;
    gap: 6px;
    align-items: center;
    font-size: 12px;
    line-height: 20px;
    color: #718198;

    &::before {
      width: 3px;
      height: 3px;
      content: '';
      background: #9aafc7;
      border-radius: 50%;
    }
  }

  .scope-row {
    display: grid;
    grid-template-columns: 80px minmax(0, 1fr);
    gap: 16px;
    align-items: flex-start;
    padding: 12px 16px;

    & + .scope-row {
      border-top: 1px solid #e9eef5;
    }
  }

  .scope-label {
    font-size: 13px;
    font-weight: 500;
    line-height: 32px;
    color: #596579;
  }

  .scope-content {
    min-width: 0;
  }

  .scope-options {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 24px;
    align-items: center;
    min-height: 32px;

    :deep(.el-radio) {
      height: 32px;
      margin-right: 0;
    }

    :deep(.el-radio__input) {
      margin-right: 6px;
    }

    :deep(.el-radio__label) {
      font-size: 14px;
      line-height: 32px;
      color: #303845;
      transition: color 0.15s ease;
    }

    :deep(.el-radio:hover .el-radio__label) {
      color: #1d84ff;
    }
  }

  .scope-picked {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    align-items: center;
    padding: 7px 9px;
    margin-top: 6px;
    background: #f4f9ff;
    border-radius: 5px;
  }

  .scope-pick-btn {
    height: 28px;
    padding: 0 11px;
    font-size: 12px;
    color: #1d84ff;
    background: var(--el-bg-color);
    border-color: #a9d2ff;
    border-radius: 5px;

    &:hover {
      color: #1d84ff;
      background: #e9f4ff;
      border-color: #1d84ff;
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
    font-weight: 500;
    color: #cf7a00;
  }

  .scope-hint {
    margin-top: 2px;
    color: #7a8ca6;
  }

  @media (width <= 900px) {
    .order-scope-panel {
      margin-right: 12px;
      margin-left: 12px;
    }

    .scope-head,
    .scope-row {
      padding-right: 12px;
      padding-left: 12px;
    }

    .scope-row {
      grid-template-columns: 1fr;
      gap: 6px;
    }

    .scope-label {
      line-height: 20px;
    }
  }
</style>
