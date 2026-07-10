<template>
  <OrderListPage mode="all" />
</template>

<script setup lang="ts">
  import OrderListPage from './modules/order-list-page.vue'

  defineOptions({ name: 'RecycleOrders' })
</script>
