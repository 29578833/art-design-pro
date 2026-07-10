<template>
  <OrderListPage mode="pending_review" />
</template>

<script setup lang="ts">
  import OrderListPage from '../modules/order-list-page.vue'

  defineOptions({ name: 'RecycleOrderAudit' })
</script>
