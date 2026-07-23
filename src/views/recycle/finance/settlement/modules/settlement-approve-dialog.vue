<template>
  <ElDialog
    v-model="dialogVisible"
    width="440px"
    align-center
    destroy-on-close
    :show-close="true"
    class="fs-form-dialog fs-approve-dialog"
    title="结算审核"
  >
    <template v-if="row">
      <div class="fs-dialog-summary">
        <div><span class="label">合同编号：</span>{{ row.contract_no }}</div>

        <div><span class="label">申请人：</span>{{ row.applicant }}</div>

        <div class="fs-dialog-summary-row">
          <span class="label">结算单类型：</span>

          <span
            class="fs-tag"
            :style="{
              color: SETTLEMENT_BILL_TYPE_CONFIG[row.settlement_type].color,

              background: SETTLEMENT_BILL_TYPE_CONFIG[row.settlement_type].bg
            }"
          >
            {{ row.settlement_type }}
          </span>
        </div>

        <div>
          <span class="label">结算金额：</span>

          <span class="fs-amount">¥ {{ row.amount.toLocaleString() }}</span>
        </div>
      </div>

      <div class="fs-form-block">
        <div class="fs-form-label">审核结果</div>

        <div class="fs-audit-choices">
          <button
            type="button"
            class="fs-audit-choice"
            :class="{ 'is-pass': pass === true }"
            @click="pass = true"
          >
            <ArtSvgIcon icon="ri:checkbox-circle-line" />

            审核通过
          </button>

          <button
            type="button"
            class="fs-audit-choice"
            :class="{ 'is-reject': pass === false }"
            @click="pass = false"
          >
            <ArtSvgIcon icon="ri:close-circle-line" />

            审核不通过
          </button>
        </div>
      </div>

      <div class="fs-form-block">
        <div class="fs-form-label">审核备注</div>

        <ElInput v-model="remark" type="textarea" :rows="3" placeholder="请输入审核意见（选填）" />
      </div>
    </template>

    <template #footer>
      <ElButton @click="dialogVisible = false">取消</ElButton>

      <ElButton
        type="primary"
        :disabled="pass === null"
        :loading="submitting"
        @click="handleSubmit"
      >
        确认提交
      </ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { ElMessage } from 'element-plus'

  import { fetchSettlementBillApprove } from '@/api/recycle/finance-settlement.mock'

  import type { SettlementBillItem } from '@/types/recycle/finance-settlement'

  import { SETTLEMENT_BILL_TYPE_CONFIG } from '@/types/recycle/finance-settlement'

  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'

  const props = defineProps<{
    visible: boolean

    row: SettlementBillItem | null
  }>()

  const emit = defineEmits<{
    'update:visible': [boolean]

    success: []
  }>()

  const dialogVisible = computed({
    get: () => props.visible,

    set: (v) => emit('update:visible', v)
  })

  const pass = ref<boolean | null>(null)

  const remark = ref('')

  const submitting = ref(false)

  watch(
    () => props.visible,

    (v) => {
      if (v) {
        pass.value = null

        remark.value = ''
      }
    }
  )

  async function handleSubmit() {
    if (!props.row || pass.value === null) return

    if (!pass.value && !remark.value.trim()) {
      ElMessage.warning('审核不通过时请填写驳回备注')

      return
    }

    submitting.value = true

    try {
      await fetchSettlementBillApprove(props.row.id, pass.value, remark.value.trim())

      ElMessage.success(pass.value ? '审核通过' : '已驳回')

      dialogVisible.value = false

      emit('success')
    } finally {
      submitting.value = false
    }
  }
</script>

<style scoped lang="scss">
  @use './settlement-dialog';
</style>
