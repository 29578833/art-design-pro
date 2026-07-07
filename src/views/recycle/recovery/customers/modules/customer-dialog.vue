<template>
  <ElDialog
    v-model="dialogVisible"
    :title="dialogType === 'add' ? '新增档案' : '编辑档案'"
    width="640px"
    align-center
    destroy-on-close
  >
    <ElForm ref="formRef" :model="formData" :rules="rules" label-width="110px">
      <ElFormItem label="档案分类" prop="category">
        <ElRadioGroup v-model="formData.category" :disabled="dialogType === 'edit'">
          <ElRadio value="customer">客户</ElRadio>
          <ElRadio value="supplier">供应商</ElRadio>
        </ElRadioGroup>
      </ElFormItem>

      <ElFormItem label="主体类型" prop="type">
        <ElRadioGroup v-model="formData.type">
          <ElRadio value="individual">个人</ElRadio>
          <ElRadio value="enterprise">企业</ElRadio>
        </ElRadioGroup>
      </ElFormItem>

      <ElDivider content-position="left">基本信息</ElDivider>

      <ElRow :gutter="16">
        <ElCol :span="12">
          <ElFormItem :label="formData.type === 'individual' ? '客户姓名' : '联系人'" prop="name">
            <ElInput v-model="formData.name" placeholder="请输入姓名" />
          </ElFormItem>
        </ElCol>
        <ElCol :span="12">
          <ElFormItem label="联系电话" prop="phone">
            <ElInput v-model="formData.phone" placeholder="请输入联系电话" />
          </ElFormItem>
        </ElCol>
        <ElCol v-if="formData.type === 'individual'" :span="12">
          <ElFormItem label="身份证号" prop="idCard">
            <ElInput v-model="formData.idCard" placeholder="18位身份证号码" />
          </ElFormItem>
        </ElCol>
        <ElCol :span="formData.type === 'individual' ? 12 : 24">
          <ElFormItem label="联系地址">
            <ElInput v-model="formData.address" placeholder="详细地址" />
          </ElFormItem>
        </ElCol>
      </ElRow>

      <template v-if="formData.type === 'enterprise'">
        <ElDivider content-position="left">企业信息</ElDivider>
        <ElRow :gutter="16">
          <ElCol :span="24">
            <ElFormItem label="企业名称" prop="enterprise">
              <ElInput v-model="formData.enterprise" placeholder="营业执照上的企业全称" />
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem label="信用代码" prop="creditCode">
              <ElInput v-model="formData.creditCode" placeholder="统一社会信用代码" />
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem label="企业联系人">
              <ElInput v-model="formData.contactPerson" placeholder="对接联系人" />
            </ElFormItem>
          </ElCol>
        </ElRow>
      </template>

      <ElDivider content-position="left">分级与状态</ElDivider>

      <ElRow :gutter="16">
        <ElCol :span="12">
          <ElFormItem label="合作商类型" prop="cooperationType">
            <ElSelect v-model="formData.cooperationType" placeholder="请选择">
              <ElOption
                v-for="(cfg, key) in COOPERATION_TYPE_CONFIG"
                :key="key"
                :label="cfg.label"
                :value="key"
              />
            </ElSelect>
          </ElFormItem>
        </ElCol>
        <ElCol :span="12">
          <ElFormItem label="客户分级" prop="grade">
            <ElSelect v-model="formData.grade" placeholder="请选择">
              <ElOption
                v-for="(cfg, key) in GRADE_CONFIG"
                :key="key"
                :label="cfg.label"
                :value="key"
              />
            </ElSelect>
          </ElFormItem>
        </ElCol>
        <ElCol :span="12">
          <ElFormItem label="信用额度">
            <ElInputNumber
              v-model="formData.creditLimit"
              :min="0"
              :step="1000"
              controls-position="right"
              class="w-full"
            />
          </ElFormItem>
        </ElCol>
        <ElCol :span="12">
          <ElFormItem label="状态">
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
            <ElInput v-model="formData.remark" type="textarea" :rows="2" placeholder="内部备注" />
          </ElFormItem>
        </ElCol>
      </ElRow>
    </ElForm>

    <template #footer>
      <ElButton @click="dialogVisible = false">取消</ElButton>
      <ElButton type="primary" :loading="submitting" @click="handleSubmit">
        {{ dialogType === 'add' ? '新增' : '保存修改' }}
      </ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { fetchCreatePartner, fetchUpdatePartner } from '@/api/recycle/customer'
  import type { PartnerFormData, RecyclePartner } from '@/types/recycle/customer'
  import {
    COOPERATION_TYPE_CONFIG,
    GRADE_CONFIG,
    PARTNER_STATUS_CONFIG
  } from '@/types/recycle/customer'
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

  const dialogType = computed(() => props.type)

  const dialogVisible = computed({
    get: () => props.visible,
    set: (val) => emit('update:visible', val)
  })

  const defaultForm = (): PartnerFormData => ({
    name: '',
    phone: '',
    category: 'customer',
    type: 'individual',
    grade: 'normal',
    cooperationType: 'individual',
    idCard: '',
    address: '',
    enterprise: '',
    creditCode: '',
    contactPerson: '',
    creditLimit: 0,
    status: 'active',
    remark: ''
  })

  const formData = ref<PartnerFormData>(defaultForm())

  const rules: FormRules = {
    category: [{ required: true, message: '请选择档案分类', trigger: 'change' }],
    type: [{ required: true, message: '请选择主体类型', trigger: 'change' }],
    name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
    phone: [{ required: true, message: '请输入联系电话', trigger: 'blur' }],
    cooperationType: [{ required: true, message: '请选择合作商类型', trigger: 'change' }],
    grade: [{ required: true, message: '请选择客户分级', trigger: 'change' }],
    idCard: [
      {
        validator: (_rule, value, callback) => {
          if (formData.value.type === 'individual' && !value) {
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
          if (formData.value.type === 'enterprise' && !value) {
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
          if (formData.value.type === 'enterprise' && !value) {
            callback(new Error('请输入统一社会信用代码'))
            return
          }
          callback()
        },
        trigger: 'blur'
      }
    ]
  }

  watch(
    () => props.visible,
    (visible) => {
      if (!visible) return

      if (props.type === 'edit' && props.partnerData?.id) {
        formData.value = {
          name: props.partnerData.name || '',
          phone: props.partnerData.phone || '',
          category: props.partnerData.category || 'customer',
          type: props.partnerData.type || 'individual',
          grade: props.partnerData.grade || 'normal',
          cooperationType: props.partnerData.cooperationType || 'individual',
          idCard: props.partnerData.idCard || '',
          address: props.partnerData.address || '',
          enterprise: props.partnerData.enterprise || '',
          creditCode: props.partnerData.creditCode || '',
          contactPerson: props.partnerData.contactPerson || '',
          creditLimit: props.partnerData.creditLimit || 0,
          status: props.partnerData.status || 'active',
          remark: props.partnerData.remark || ''
        }
      } else {
        formData.value = defaultForm()
      }

      nextTick(() => formRef.value?.clearValidate())
    }
  )

  async function handleSubmit() {
    if (!formRef.value) return

    await formRef.value.validate()
    submitting.value = true

    try {
      if (props.type === 'edit' && props.partnerData?.id) {
        await fetchUpdatePartner(props.partnerData.id, formData.value)
        ElMessage.success('修改成功')
      } else {
        await fetchCreatePartner(formData.value)
        ElMessage.success('新增成功')
      }
      dialogVisible.value = false
      emit('submit')
    } finally {
      submitting.value = false
    }
  }
</script>
