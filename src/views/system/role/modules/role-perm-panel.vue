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
          :indeterminate="isMenuIndeterminate(top)"
          @click.stop
          @change="(v: CheckboxValueType) => toggleMenu(top, !!v)"
        />
        <span class="perm-row-label">{{ top.title || top.menu_name || `菜单${top.id}` }}</span>
        <div v-if="getOperations(top).length" class="perm-btns" @click.stop>
          <label v-for="op in getOperations(top)" :key="op.id" class="perm-btn-item">
            <ElCheckbox
              :model-value="isOpChecked(op.id)"
              @change="(v: CheckboxValueType) => toggleAction(top, op, !!v)"
            />
            <span>{{ op.name }}</span>
          </label>
          <span class="operation-badge">操作级权限</span>
        </div>
      </div>

      <template v-else>
        <!-- 一级：父节点全选 -->
        <div class="perm-group-head" @click="toggleTop(top, !isTopChecked(top))">
          <ElCheckbox
            :model-value="isTopChecked(top)"
            :indeterminate="isTopIndeterminate(top)"
            @click.stop
            @change="(v: CheckboxValueType) => toggleTop(top, !!v)"
          />
          <span class="perm-group-title">{{ top.title || top.menu_name || `菜单${top.id}` }}</span>
        </div>

        <!-- 二级：子菜单 + 操作级权限 -->
        <div
          v-for="row in getPermRows(top)"
          :key="row.id"
          class="perm-row"
          @click="toggleMenu(row, !isMenuChecked(row))"
        >
          <ElCheckbox
            :model-value="isMenuChecked(row)"
            :indeterminate="isMenuIndeterminate(row)"
            @click.stop
            @change="(v: CheckboxValueType) => toggleMenu(row, !!v)"
          />
          <span class="perm-row-label">{{ row.title || row.menu_name || `菜单${row.id}` }}</span>
          <div v-if="getOperations(row).length" class="perm-btns" @click.stop>
            <label v-for="op in getOperations(row)" :key="op.id" class="perm-btn-item">
              <ElCheckbox
                :model-value="isOpChecked(op.id)"
                @change="(v: CheckboxValueType) => toggleAction(row, op, !!v)"
              />
              <span>{{ op.name }}</span>
            </label>
            <span class="operation-badge">操作级权限</span>
          </div>
        </div>
      </template>
    </div>
    <div v-if="!menus.length" class="perm-empty">暂无权限菜单</div>
  </div>
</template>

<script setup lang="ts">
  import type { CheckboxValueType } from 'element-plus'
  import type {
    SystemRoleMenuNode,
    SystemRoleMenuOperation
  } from '@/types/recycle/system/system'

  const props = defineProps<{
    menus: SystemRoleMenuNode[]
    modelValue: number[]
  }>()

  const emit = defineEmits<{
    'update:modelValue': [number[]]
  }>()

  const checked = computed(() => new Set(props.modelValue.map(Number)))

  function getOperations(node: SystemRoleMenuNode): SystemRoleMenuOperation[] {
    return (node.operations || []).map((op) => ({
      id: Number(op.id),
      name: op.name,
      unique_auth: op.unique_auth,
      offset: op.offset
    }))
  }

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

  function isOpChecked(id: number) {
    return checked.value.has(Number(id))
  }

  /** 菜单行是否全选：菜单 id 已勾，且全部操作项已勾 */
  function isMenuChecked(node: SystemRoleMenuNode) {
    const mid = Number(node.id)
    if (!checked.value.has(mid)) {
      const ops = getOperations(node)
      return ops.length > 0 && ops.every((op) => checked.value.has(op.id))
    }
    return getOperations(node).every((op) => checked.value.has(op.id))
  }

  /** 部分操作勾选、或仅勾了菜单未勾操作时为半选 */
  function isMenuIndeterminate(node: SystemRoleMenuNode) {
    const ops = getOperations(node)
    if (!ops.length) return false
    if (isMenuChecked(node)) return false
    if (checked.value.has(Number(node.id))) return true
    return ops.some((op) => checked.value.has(op.id))
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
    return rows.some((r) => {
      if (checked.value.has(Number(r.id))) return true
      return getOperations(r).some((op) => checked.value.has(op.id))
    })
  }

  function applyMenu(next: Set<number>, node: SystemRoleMenuNode, on: boolean) {
    const mid = Number(node.id)
    const ops = getOperations(node)
    if (on) {
      next.add(mid)
      ops.forEach((op) => next.add(op.id))
    } else {
      next.delete(mid)
      ops.forEach((op) => next.delete(op.id))
    }
  }

  function toggleMenu(node: SystemRoleMenuNode, on: boolean) {
    const next = new Set(checked.value)
    applyMenu(next, node, on)
    setChecked(next)
  }

  /** 勾选操作项时同步勾上菜单，保证侧栏可见 */
  function toggleAction(node: SystemRoleMenuNode, op: SystemRoleMenuOperation, on: boolean) {
    const next = new Set(checked.value)
    const oid = Number(op.id)
    if (on) {
      next.add(oid)
      next.add(Number(node.id))
    } else {
      next.delete(oid)
    }
    setChecked(next)
  }

  /** 勾选/取消父节点时联动所有子节点及操作项 */
  function toggleTop(top: SystemRoleMenuNode, on: boolean) {
    const next = new Set(checked.value)
    const topId = Number(top.id)
    for (const row of getPermRows(top)) {
      applyMenu(next, row, on)
    }
    if (on) next.add(topId)
    else next.delete(topId)
    setChecked(next)
  }
</script>
