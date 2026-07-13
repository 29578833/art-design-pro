<template>
  <ElDialog
    v-model="dialogVisible"
    :title="isEdit ? '编辑用户' : '新增用户'"
    width="480px"
    align-center
    destroy-on-close
    class="admin-user-dialog"
    @open="handleOpen"
    @closed="handleClosed"
  >
    <ElForm ref="formRef" :model="form" :rules="rules" label-position="top">
      <ElRow :gutter="12">
        <ElCol :span="12">
          <ElFormItem label="真实姓名" prop="real_name">
            <ElInput v-model="form.real_name" placeholder="请输入真实姓名" />
          </ElFormItem>
        </ElCol>
        <ElCol :span="12">
          <ElFormItem label="用户名" prop="account">
            <ElInput v-model="form.account" placeholder="登录账号" :disabled="isEdit" />
          </ElFormItem>
        </ElCol>
        <ElCol :span="12">
          <ElFormItem label="手机号" prop="phone">
            <ElInput v-model="form.phone" placeholder="请输入手机号" />
          </ElFormItem>
        </ElCol>
        <ElCol :span="12">
          <ElFormItem label="邮箱" prop="email">
            <ElInput v-model="form.email" placeholder="选填" />
          </ElFormItem>
        </ElCol>
        <ElCol :span="12">
          <ElFormItem label="分配角色" prop="roles">
            <ElSelect v-model="form.roles" placeholder="请选择角色" class="w-full" filterable>
              <ElOption
                v-for="role in roleOptions"
                :key="role.id"
                :label="role.role_name || `角色${role.id}`"
                :value="role.id"
              />
            </ElSelect>
          </ElFormItem>
        </ElCol>
        <ElCol :span="12">
          <ElFormItem label="所属部门" prop="department">
            <ElInput v-model="form.department" placeholder="选填" />
          </ElFormItem>
        </ElCol>
        <ElCol v-if="!isEdit" :span="12">
          <ElFormItem label="初始密码" prop="pwd">
            <ElInput v-model="form.pwd" type="password" show-password placeholder="6-32位" />
          </ElFormItem>
        </ElCol>
        <ElCol v-if="!isEdit" :span="12">
          <ElFormItem label="确认密码" prop="conf_pwd">
            <ElInput v-model="form.conf_pwd" type="password" show-password placeholder="再次输入" />
          </ElFormItem>
        </ElCol>
        <ElCol :span="24">
          <ElFormItem label="状态" prop="status">
            <ElRadioGroup v-model="form.status">
              <ElRadio :value="1">开启</ElRadio>
              <ElRadio :value="0">关闭</ElRadio>
            </ElRadioGroup>
          </ElFormItem>
        </ElCol>
      </ElRow>
    </ElForm>

    <template #footer>
      <ElButton @click="dialogVisible = false">取消</ElButton>
      <ElButton type="primary" :loading="submitting" @click="handleSubmit">保存</ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import type { FormInstance, FormRules } from 'element-plus'
  import { ElMessage } from 'element-plus'
  import {
    fetchAdminCreate,
    fetchAdminEditForm,
    fetchAdminRoleOptions,
    fetchAdminUpdate
  } from '@/api/recycle/system-admin'
  import type {
    SystemAdminSaveParams,
    SystemAdminStatus,
    SystemRoleItem
  } from '@/types/recycle/system'

  interface Props {
    visible: boolean
    type: 'add' | 'edit'
    adminId?: number | null
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

  const isEdit = computed(() => props.type === 'edit')
  const formRef = ref<FormInstance>()
  const submitting = ref(false)
  const loadingForm = ref(false)
  const roleOptions = ref<SystemRoleItem[]>([])

  const form = reactive<{
    account: string
    real_name: string
    phone: string
    email: string
    department: string
    roles?: number
    status: SystemAdminStatus
    pwd: string
    conf_pwd: string
  }>({
    account: '',
    real_name: '',
    phone: '',
    email: '',
    department: '',
    roles: undefined,
    status: 1,
    pwd: '',
    conf_pwd: ''
  })

  const rules = computed<FormRules>(() => ({
    real_name: [{ required: true, message: '请输入真实姓名', trigger: 'blur' }],
    account: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
    phone: [{ required: true, message: '请输入手机号', trigger: 'blur' }],
    roles: [{ required: true, message: '请选择角色', trigger: 'change' }],
    pwd: isEdit.value
      ? []
      : [
          { required: true, message: '请输入初始密码', trigger: 'blur' },
          { min: 6, max: 32, message: '密码长度 6-32 位', trigger: 'blur' }
        ],
    conf_pwd: isEdit.value
      ? []
      : [
          { required: true, message: '请确认密码', trigger: 'blur' },
          {
            validator: (_rule, value, callback) => {
              if (value !== form.pwd) callback(new Error('两次密码不一致'))
              else callback()
            },
            trigger: 'blur'
          }
        ]
  }))

  async function loadRoles() {
    try {
      roleOptions.value = await fetchAdminRoleOptions()
    } catch {
      roleOptions.value = []
    }
  }

  async function handleOpen() {
    await loadRoles()
    if (isEdit.value && props.adminId) {
      loadingForm.value = true
      try {
        const detail = await fetchAdminEditForm(props.adminId)
        form.account = detail.account
        form.real_name = detail.real_name || ''
        form.phone = detail.phone || ''
        form.email = detail.email || ''
        form.department = detail.department || ''
        form.status = detail.status ?? 1
        form.roles = Array.isArray(detail.roles)
          ? Number(detail.roles[0]) || undefined
          : Number(detail.roles) || undefined
        form.pwd = ''
        form.conf_pwd = ''
      } catch {
        ElMessage.error('加载用户信息失败')
      } finally {
        loadingForm.value = false
      }
    }
  }

  async function handleSubmit() {
    const valid = await formRef.value?.validate().catch(() => false)
    if (!valid) return
    if (!form.roles) {
      ElMessage.warning('请选择角色')
      return
    }

    const payload: SystemAdminSaveParams = {
      account: form.account.trim(),
      real_name: form.real_name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      department: form.department.trim(),
      roles: form.roles,
      status: form.status,
      pwd: form.pwd,
      conf_pwd: form.conf_pwd
    }

    submitting.value = true
    try {
      if (isEdit.value && props.adminId) {
        await fetchAdminUpdate(props.adminId, payload)
      } else {
        await fetchAdminCreate(payload)
      }
      emit('success')
      dialogVisible.value = false
    } finally {
      submitting.value = false
    }
  }

  function handleClosed() {
    form.account = ''
    form.real_name = ''
    form.phone = ''
    form.email = ''
    form.department = ''
    form.roles = undefined
    form.status = 1
    form.pwd = ''
    form.conf_pwd = ''
    formRef.value?.resetFields()
  }
</script>

<style scoped lang="scss">
  .w-full {
    width: 100%;
  }
</style>

<style lang="scss">
  .admin-user-dialog {
    .el-dialog__body {
      padding-top: 8px;
    }
  }
</style>
