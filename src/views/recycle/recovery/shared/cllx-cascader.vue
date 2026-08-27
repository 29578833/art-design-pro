<template>
  <ElCascader
    v-model="model"
    :options="cascaderOptions"
    :props="cascaderProps"
    :placeholder="placeholder"
    :disabled="disabled"
    clearable
    filterable
    style="width: 100%"
    @change="handleChange"
  />
</template>

<script setup lang="ts">
  import { fetchCllxCascade } from '@/api/recycle/data-dict'
  import type { CllxCascadeNode } from '@/types/recycle/system/data-dict'
  import type { CascaderOption } from 'element-plus'

  defineOptions({ name: 'CllxCascader' })

  withDefaults(
    defineProps<{
      placeholder?: string
      disabled?: boolean
    }>(),
    {
      placeholder: '请选择',
      disabled: false
    }
  )

  const model = defineModel<string>({ default: '' })

  const cllxOptions = ref<CllxCascadeNode[]>([])
  const cascaderOptions = computed(() => cllxOptions.value as unknown as CascaderOption[])
  const cascaderProps = {
    value: 'value',
    label: 'label',
    children: 'children',
    emitPath: false
  } as const

  function handleChange(val: unknown) {
    model.value = val == null || Array.isArray(val) ? '' : String(val)
  }

  async function loadOptions() {
    cllxOptions.value = (await fetchCllxCascade().catch(() => [])) || []
  }

  onMounted(loadOptions)

  defineExpose({ loadOptions })
</script>
