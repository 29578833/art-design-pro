<template>
  <div class="role-perm-panel">
    <div v-for="top in menus" :key="top.id" class="perm-group">
      <!-- 无子级：顶级本身就是功能菜单 -->
      <div
        v-if="!top.children?.length"
        class="perm-row perm-row--root"
        @click="toggleMenu(top, !isMenuChecked(top))"
      >
        <ElCheckbox
          :model-value="isMenuChecked(top)"
          @click.stop
          @change="(v: CheckboxValueType) => toggleMenu(top, !!v)"
        />
        <span class="perm-row-label">{{ top.title || top.menu_name || `菜单${top.id}` }}</span>
      </div>

      <template v-else>
        <!-- 一级：父节点全选 -->
        <div
          class="perm-group-head"
          @click="toggleTop(top, !isTopChecked(top))"
        >
          <ElCheckbox
            :model-value="isTopChecked(top)"
            :indeterminate="isTopIndeterminate(top)"
            @click.stop
            @change="(v: CheckboxValueType) => toggleTop(top, !!v)"
          />
          <span class="perm-group-title">{{ top.title || top.menu_name || `菜单${top.id}` }}</span>
        </div>

        <!-- 二级：子菜单 -->
        <div
          v-for="row in getPermRows(top)"
          :key="row.id"
          class="perm-row"
          @click="toggleMenu(row, !isMenuChecked(row))"
        >
          <ElCheckbox
            :model-value="isMenuChecked(row)"
            @click.stop
            @change="(v: CheckboxValueType) => toggleMenu(row, !!v)"
          />
          <span class="perm-row-label">{{ row.title || row.menu_name || `菜单${row.id}` }}</span>
        </div>
      </template>
    </div>
    <div v-if="!menus.length" class="perm-empty">暂无权限菜单</div>
  </div>
</template>

<script setup lang="ts">
  import type { CheckboxValueType } from 'element-plus'
  import type { SystemRoleMenuNode } from '@/types/recycle/system/system'

  const props = defineProps<{
    menus: SystemRoleMenuNode[]
    modelValue: number[]
  }>()

  const emit = defineEmits<{
    'update:modelValue': [number[]]
  }>()

  const checked = computed(() => new Set(props.modelValue.map(Number)))

  /** 收集某顶级下所有叶子菜单 */
  function getPermRows(top: SystemRoleMenuNode): SystemRoleMenuNode[] {
    if (!top.children?.length) return [top]
    const rows: SystemRoleMenuNode[] = []
    const walk = (nodes: SystemRoleMenuNode[]) => {
      for (const node of nodes) {
        if (node.children?.length) walk(node.children)
        else rows.push(node)
      }
    }
    walk(top.children)
    return rows
  }

  function setChecked(next: Set<number>) {
    emit('update:modelValue', [...next])
  }

  function isMenuChecked(node: SystemRoleMenuNode) {
    return checked.value.has(Number(node.id))
  }

  /** 父节点：全部子节点勾选时为选中 */
  function isTopChecked(top: SystemRoleMenuNode) {
    const rows = getPermRows(top)
    return rows.length > 0 && rows.every((r) => isMenuChecked(r))
  }

  /** 父节点：部分子节点勾选时为半选 */
  function isTopIndeterminate(top: SystemRoleMenuNode) {
    if (isTopChecked(top)) return false
    const rows = getPermRows(top)
    return rows.some((r) => isMenuChecked(r))
  }

  function toggleMenu(node: SystemRoleMenuNode, on: boolean) {
    const next = new Set(checked.value)
    const mid = Number(node.id)
    if (on) {
      next.add(mid)
    } else {
      next.delete(mid)
      // 清理历史按钮权限 id（menuId*10+1~4）
      for (let offset = 1; offset <= 4; offset++) {
        next.delete(mid * 10 + offset)
      }
    }
    setChecked(next)
  }

  /** 勾选/取消父节点时联动所有子节点 */
  function toggleTop(top: SystemRoleMenuNode, on: boolean) {
    const next = new Set(checked.value)
    const topId = Number(top.id)
    for (const row of getPermRows(top)) {
      const mid = Number(row.id)
      if (on) {
        next.add(mid)
      } else {
        next.delete(mid)
        for (let offset = 1; offset <= 4; offset++) {
          next.delete(mid * 10 + offset)
        }
      }
    }
    if (on) next.add(topId)
    else next.delete(topId)
    setChecked(next)
  }
</script>
