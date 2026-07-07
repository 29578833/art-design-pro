<template>
  <ArtSearchBar
    ref="searchBarRef"
    v-model="formData"
    :items="formItems"
    :rules="rules"
    @reset="handleReset"
    @search="handleSearch"
  />
</template>

<script setup lang="ts">
  import type { PartnerSearchParams } from '@/types/recycle/customer'
  import {
    COOPERATION_TYPE_CONFIG,
    GRADE_CONFIG,
    PARTNER_CATEGORY_CONFIG,
    PARTNER_STATUS_CONFIG,
    PARTNER_TYPE_CONFIG
  } from '@/types/recycle/customer'

  interface Props {
    modelValue: PartnerSearchParams
  }

  interface Emits {
    (e: 'update:modelValue', value: PartnerSearchParams): void
    (e: 'search', params: PartnerSearchParams): void
    (e: 'reset'): void
  }

  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()

  const searchBarRef = ref()

  const formData = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
  })

  const rules = {}

  const formItems = computed(() => [
    {
      label: '关键词',
      key: 'keyword',
      type: 'input',
      placeholder: '姓名/手机号/企业名称/编号',
      clearable: true,
      span: 6
    },
    {
      label: '分类',
      key: 'category',
      type: 'select',
      span: 4,
      props: {
        placeholder: '全部分类',
        options: [
          { label: '全部分类', value: 'all' },
          ...Object.entries(PARTNER_CATEGORY_CONFIG).map(([value, cfg]) => ({
            label: cfg.label,
            value
          }))
        ]
      }
    },
    {
      label: '主体类型',
      key: 'type',
      type: 'select',
      span: 4,
      props: {
        placeholder: '全部类型',
        options: [
          { label: '全部类型', value: 'all' },
          ...Object.entries(PARTNER_TYPE_CONFIG).map(([value, cfg]) => ({
            label: cfg.label,
            value
          }))
        ]
      }
    },
    {
      label: '客户分级',
      key: 'grade',
      type: 'select',
      span: 4,
      props: {
        placeholder: '全部分级',
        options: [
          { label: '全部分级', value: 'all' },
          ...Object.entries(GRADE_CONFIG).map(([value, cfg]) => ({
            label: cfg.label,
            value
          }))
        ]
      }
    },
    {
      label: '合作商类型',
      key: 'cooperationType',
      type: 'select',
      span: 4,
      props: {
        placeholder: '全部合作商',
        options: [
          { label: '全部合作商', value: 'all' },
          ...Object.entries(COOPERATION_TYPE_CONFIG).map(([value, cfg]) => ({
            label: cfg.label,
            value
          }))
        ]
      }
    },
    {
      label: '状态',
      key: 'status',
      type: 'select',
      span: 4,
      props: {
        placeholder: '全部状态',
        options: [
          { label: '全部状态', value: 'all' },
          ...Object.entries(PARTNER_STATUS_CONFIG).map(([value, cfg]) => ({
            label: cfg.label,
            value
          }))
        ]
      }
    }
  ])

  function handleReset() {
    emit('reset')
  }

  async function handleSearch(params: PartnerSearchParams) {
    await searchBarRef.value.validate()
    emit('search', params)
  }
</script>
