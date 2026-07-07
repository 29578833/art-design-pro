<template>
  <ElDialog
    v-model="dialogVisible"
    :title="dialogType === 'add' ? '新增客户' : '编辑客户'"
    width="640px"
    align-center
    destroy-on-close
    class="customer-form-dialog"
  >
    <ElForm
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-position="top"
      class="customer-form"
    >
      <div class="form-block">
        <ElFormItem label="客户类型" prop="groupId" required>
          <ElRadioGroup v-model="formData.groupId" class="customer-type-group">
            <ElRadioButton v-for="group in groupOptions" :key="group.id" :value="group.id">
              {{ group.groupName }}
            </ElRadioButton>
          </ElRadioGroup>
        </ElFormItem>
      </div>

      <div class="form-block">
        <div class="form-section-title">基本信息</div>
        <ElRow :gutter="16">
          <ElCol :span="12">
            <ElFormItem :label="isEnterprise ? '联系人姓名' : '客户姓名'" prop="name" required>
              <ElInput v-model="formData.name" placeholder="请输入姓名" />
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem label="联系电话" prop="phone" required>
              <ElInput v-model="formData.phone" placeholder="请输入手机号" />
            </ElFormItem>
          </ElCol>
          <ElCol v-if="!isEnterprise" :span="12">
            <ElFormItem label="身份证号" prop="idCard" required>
              <ElInput v-model="formData.idCard" placeholder="18位身份证号码" />
            </ElFormItem>
          </ElCol>
          <ElCol :span="isEnterprise ? 24 : 12">
            <ElFormItem label="联系地址">
              <ElInput v-model="formData.address" placeholder="详细地址" />
            </ElFormItem>
          </ElCol>
        </ElRow>
      </div>

      <div v-if="isEnterprise" class="form-block">
        <div class="form-section-title">企业信息</div>
        <ElRow :gutter="16">
          <ElCol :span="24">
            <ElFormItem label="企业名称" prop="enterprise" required>
              <ElInput v-model="formData.enterprise" placeholder="营业执照上的企业全称" />
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem label="统一社会信用代码" prop="creditCode" required>
              <ElInput v-model="formData.creditCode" placeholder="18位统一社会信用代码" />
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem label="企业联系人">
              <ElInput v-model="formData.contactPerson" placeholder="对接联系人姓名" />
            </ElFormItem>
          </ElCol>
        </ElRow>
      </div>

      <div class="form-block">
        <div class="form-section-title">客户分级</div>
        <ElRow :gutter="16">
          <ElCol :span="12">
            <ElFormItem label="客户分级" prop="levelId" required>
              <ElSelect v-model="formData.levelId" placeholder="请选择">
                <ElOption
                  v-for="level in levelOptions"
                  :key="level.id"
                  :label="level.name"
                  :value="level.id"
                />
              </ElSelect>
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem label="客户状态">
              <ElSelect v-model="formData.status" placeholder="请选择">
                <ElOption
                  v-for="(cfg, key) in PARTNER_STATUS_CONFIG"
                  :key="key"
                  :label="cfg.label"
                  :value="key"
                />
              </ElSelect>
            </ElFormItem>
          </ElCol>
          <ElCol :span="24">
            <ElFormItem label="备注说明">
              <ElInput v-model="formData.remark" placeholder="内部备注" />
            </ElFormItem>
          </ElCol>
        </ElRow>
      </div>
    </ElForm>

    <template #footer>
      <ElButton @click="dialogVisible = false">取消</ElButton>
      <ElButton type="primary" :loading="submitting" @click="handleSubmit">
        {{ dialogType === 'add' ? '新增客户' : '保存修改' }}
      </ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import {
    fetchCreatePartner,
    fetchUpdatePartner,
    fetchUserGroupList,
    fetchUserLevelList,
    fetchUserSaveInfo
  } from '@/api/recycle/customer'
  import type {
    PartnerFormData,
    RecyclePartner,
    UserGroupOption,
    UserLevelOption
  } from '@/types/recycle/customer'
  import { PARTNER_STATUS_CONFIG, resolvePartnerTypeFromGroup } from '@/types/recycle/customer'
  import type { DialogType } from '@/types'
  import type { FormInstance, FormRules } from 'element-plus'

  interface Props {
    visible: boolean
    type: DialogType
    partnerData?: Partial<RecyclePartner>
  }

  interface Emits {
    (e: 'update:visible', value: boolean): void
    (e: 'submit'): void
  }

  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()

  const formRef = ref<FormInstance>()
  const submitting = ref(false)
  const levelOptions = ref<UserLevelOption[]>([])
  const groupOptions = ref<UserGroupOption[]>([])

  const dialogType = computed(() => props.type)

  const dialogVisible = computed({
    get: () => props.visible,
    set: (val) => emit('update:visible', val)
  })

  const selectedGroupName = computed(
    () => groupOptions.value.find((item) => item.id === formData.value.groupId)?.groupName || ''
  )

  const isEnterprise = computed(
    () => resolvePartnerTypeFromGroup(selectedGroupName.value) === 'enterprise'
  )

  const defaultForm = (): PartnerFormData => ({
    name: '',
    phone: '',
    groupId: 0,
    levelId: 0,
    idCard: '',
    address: '',
    enterprise: '',
    creditCode: '',
    contactPerson: '',
    status: 'active',
    remark: ''
  })

  const formData = ref<PartnerFormData>(defaultForm())

  const rules: FormRules = {
    groupId: [
      {
        validator: (_rule, value, callback) => {
          if (!value) {
            callback(new Error('请选择客户类型'))
            return
          }
          callback()
        },
        trigger: 'change'
      }
    ],
    name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
    phone: [{ required: true, message: '请输入联系电话', trigger: 'blur' }],
    levelId: [
      {
        validator: (_rule, value, callback) => {
          if (!value) {
            callback(new Error('请选择客户分级'))
            return
          }
          callback()
        },
        trigger: 'change'
      }
    ],
    idCard: [
      {
        validator: (_rule, value, callback) => {
          if (!isEnterprise.value && !value) {
            callback(new Error('请输入身份证号'))
            return
          }
          callback()
        },
        trigger: 'blur'
      }
    ],
    enterprise: [
      {
        validator: (_rule, value, callback) => {
          if (isEnterprise.value && !value) {
            callback(new Error('请输入企业名称'))
            return
          }
          callback()
        },
        trigger: 'blur'
      }
    ],
    creditCode: [
      {
        validator: (_rule, value, callback) => {
          if (isEnterprise.value && !value) {
            callback(new Error('请输入统一社会信用代码'))
            return
          }
          callback()
        },
        trigger: 'blur'
      }
    ]
  }

  async function loadOptions() {
    const [levels, groups] = await Promise.all([fetchUserLevelList(), fetchUserGroupList()])
    levelOptions.value = levels
    groupOptions.value = groups
  }

  async function fillEditForm(uid: string) {
    const res = await fetchUserSaveInfo(uid)
    const user = res.userInfo || {}
    const groupId = Number(user.group_id || 0)
    const groupName =
      res.groupInfo?.find((item) => item.id === groupId)?.group_name ||
      groupOptions.value.find((item) => item.id === groupId)?.groupName ||
      ''
    const enterpriseType = resolvePartnerTypeFromGroup(groupName) === 'enterprise'

    formData.value = {
      name: String(user.real_name || user.nickname || ''),
      phone: String(user.phone || ''),
      groupId,
      levelId: Number(user.level || 0),
      idCard: String(user.card_id || ''),
      address: String(user.addres || ''),
      enterprise: enterpriseType ? String(user.real_name || user.nickname || '') : '',
      creditCode: '',
      contactPerson: '',
      status: user.status === 1 || user.status === '1' ? 'active' : 'inactive',
      remark: String(user.mark || '')
    }

    if (res.levelInfo?.length) {
      levelOptions.value = res.levelInfo.map((item) => ({ id: item.id, name: item.name }))
    }
    if (res.groupInfo?.length) {
      groupOptions.value = res.groupInfo.map((item) => ({
        id: item.id,
        groupName: item.group_name
      }))
    }
  }

  watch(
    () => props.visible,
    async (visible) => {
      if (!visible) return

      await loadOptions()

      if (props.type === 'edit' && props.partnerData?.id) {
        await fillEditForm(props.partnerData.id)
      } else {
        formData.value = {
          ...defaultForm(),
          groupId: groupOptions.value[0]?.id || 0,
          levelId: levelOptions.value[0]?.id || 0
        }
      }

      nextTick(() => formRef.value?.clearValidate())
    }
  )

  async function handleSubmit() {
    if (!formRef.value) return

    await formRef.value.validate()
    submitting.value = true

    try {
      const payload: PartnerFormData = {
        ...formData.value,
        name:
          isEnterprise.value && formData.value.enterprise
            ? formData.value.enterprise
            : formData.value.name
      }

      if (props.type === 'edit' && props.partnerData?.id) {
        await fetchUpdatePartner(props.partnerData.id, payload, selectedGroupName.value)
      } else {
        await fetchCreatePartner(payload, selectedGroupName.value)
      }
      dialogVisible.value = false
      emit('submit')
    } finally {
      submitting.value = false
    }
  }
</script>

<style scoped lang="scss">
  .customer-form-dialog {
    :deep(.el-dialog__body) {
      max-height: calc(90vh - 120px);
      overflow-y: auto;
    }

    .customer-form {
      padding: 0 24px !important;

      :deep(.el-form-item) {
        margin-bottom: 10px;
      }

      :deep(.el-form-item__label) {
        padding-bottom: 4px;
        margin-bottom: 0;
        font-size: 14px;
        font-weight: 400;
        line-height: 1.5;
        color: var(--art-gray-600);
      }

      :deep(.el-form-item__content) {
        line-height: normal;
      }

      :deep(.el-input),
      :deep(.el-select) {
        width: 100%;
      }

      :deep(.el-input__inner),
      :deep(.el-select__wrapper) {
        font-size: 13px;
      }
    }

    .form-block + .form-block {
      margin-top: 20px;
    }

    .form-section-title {
      padding-bottom: 4px;
      margin-bottom: 12px;
      font-size: 13px;
      font-weight: 600;
      color: var(--art-gray-600);
      border-bottom: 1px solid #f0f0f0;
    }

    .customer-type-group {
      :deep(.el-radio-button__inner) {
        min-width: 88px;
        padding: 8px 16px;
        font-size: 12px;
      }
    }

    :deep(.el-row) {
      row-gap: 16px;
    }
  }
</style>
