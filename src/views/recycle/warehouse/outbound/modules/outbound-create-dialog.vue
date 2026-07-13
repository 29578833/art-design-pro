<template>
  <ElDialog
    v-model="dialogVisible"
    title="新建出库单"
    width="560px"
    align-center
    destroy-on-close
    @closed="handleClosed"
  >
    <ElForm ref="formRef" :model="form" :rules="rules" label-position="top">
      <ElFormItem label="出库类型" prop="exit_type">
        <div class="ob-type-cards">
          <button
            v-for="opt in typeOptions"
            :key="opt.value"
            type="button"
            class="ob-type-card"
            :class="{ 'is-active': form.exit_type === opt.value }"
            :style="
              form.exit_type === opt.value
                ? { borderColor: opt.color, background: opt.bg }
                : undefined
            "
            @click="form.exit_type = opt.value"
          >
            <span class="ob-type-card-label" :style="{ color: opt.color }">{{ opt.label }}</span>
            <span class="ob-type-card-desc">{{ opt.desc }}</span>
          </button>
        </div>
      </ElFormItem>

      <div class="ob-form-row">
        <ElFormItem label="客户名称/调拨目的" prop="customer_name" class="ob-form-half">
          <ElInput v-model="form.customer_name" placeholder="请输入客户或目的" maxlength="100" />
        </ElFormItem>
        <ElFormItem label="联系电话" prop="contact_phone" class="ob-form-half">
          <ElInput v-model="form.contact_phone" placeholder="选填" maxlength="32" />
        </ElFormItem>
      </div>

      <ElFormItem label="物品明细" prop="items_desc">
        <ElInput
          v-model="form.items_desc"
          type="textarea"
          :rows="3"
          placeholder="如：发动机总成×1、方向机总成×2"
          maxlength="1000"
        />
      </ElFormItem>

      <ElFormItem label="合计金额（元）" prop="total_amount">
        <ElInputNumber
          v-model="form.total_amount"
          :min="0"
          :precision="2"
          controls-position="right"
          class="w-full"
        />
      </ElFormItem>

      <ElFormItem label="备注" prop="remark">
        <ElInput
          v-model="form.remark"
          type="textarea"
          :rows="2"
          placeholder="选填"
          maxlength="1000"
        />
      </ElFormItem>
    </ElForm>

    <template #footer>
      <ElButton @click="dialogVisible = false">取消</ElButton>
      <ElButton type="primary" :loading="submitting" @click="handleSubmit">提交出库单</ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import type { FormInstance, FormRules } from 'element-plus'
  import { fetchSaleOutboundCreate } from '@/api/recycle/sale-outbound'
  import type { SaleOutboundCreateParams, SaleOutboundType } from '@/types/recycle/sale-outbound'
  import { SALE_OUTBOUND_TYPE_CONFIG } from '@/types/recycle/sale-outbound'

  interface Props {
    visible: boolean
  }

  interface Emits {
    (e: 'update:visible', value: boolean): void
    (e: 'success'): void
  }

  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()

  const dialogVisible = computed({
    get: () => props.visible,
    set: (val) => emit('update:visible', val)
  })

  const formRef = ref<FormInstance>()
  const submitting = ref(false)

  const typeOptions = (
    Object.entries(SALE_OUTBOUND_TYPE_CONFIG) as [
      SaleOutboundType,
      (typeof SALE_OUTBOUND_TYPE_CONFIG)[SaleOutboundType]
    ][]
  ).map(([value, cfg]) => ({
    value,
    label: cfg.label,
    color: cfg.color,
    bg: cfg.bg,
    desc:
      value === 'sale' ? '销售给外部客户' : value === 'transfer' ? '内部库位调拨' : '报废处置出库'
  }))

  const form = reactive<SaleOutboundCreateParams>({
    exit_type: 'sale',
    customer_name: '',
    contact_phone: '',
    items_desc: '',
    total_amount: 0,
    remark: ''
  })

  const rules: FormRules = {
    exit_type: [{ required: true, message: '请选择出库类型', trigger: 'change' }],
    customer_name: [{ required: true, message: '请输入客户名称或调拨目的', trigger: 'blur' }],
    items_desc: [{ required: true, message: '请输入物品明细', trigger: 'blur' }],
    total_amount: [{ required: true, message: '请输入合计金额', trigger: 'blur' }]
  }

  function resetForm() {
    form.exit_type = 'sale'
    form.customer_name = ''
    form.contact_phone = ''
    form.items_desc = ''
    form.total_amount = 0
    form.remark = ''
  }

  async function handleSubmit() {
    const valid = await formRef.value?.validate().catch(() => false)
    if (!valid) return

    submitting.value = true
    try {
      await fetchSaleOutboundCreate({
        exit_type: form.exit_type,
        customer_name: form.customer_name.trim(),
        contact_phone: form.contact_phone?.trim() || '',
        items_desc: form.items_desc.trim(),
        total_amount: form.total_amount || 0,
        remark: form.remark?.trim() || ''
      })
      emit('success')
      dialogVisible.value = false
    } finally {
      submitting.value = false
    }
  }

  function handleClosed() {
    formRef.value?.resetFields()
    resetForm()
  }
</script>

<style scoped lang="scss">
  .ob-type-cards {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    width: 100%;
  }

  .ob-type-card {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 12px;
    text-align: left;
    cursor: pointer;
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    transition: all 0.2s;

    &.is-active {
      border-width: 1.5px;
    }
  }

  .ob-type-card-label {
    font-size: 13px;
    font-weight: 600;
  }

  .ob-type-card-desc {
    font-size: 11px;
    color: #9ca3af;
  }

  .ob-form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  .ob-form-half {
    margin-bottom: 18px;
  }

  .w-full {
    width: 100%;
  }
</style>
