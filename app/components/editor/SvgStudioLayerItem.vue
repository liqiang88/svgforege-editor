<template>
  <li class="layer-item" :class="{ root: node.isRoot }">
    <div
      class="row"
      :class="{ selected: selectedId === node.id, root: node.isRoot }"
      :style="{ paddingLeft: `${0.55 + node.depth * 0.75}rem` }"
      @click="$emit('select', node.id)"
    >
      <span class="tag">{{ node.label }}</span>
      <span class="idx">{{ node.indexLabel }}</span>
      <span class="spacer" />
      <button
        type="button"
        class="act"
        :title="node.visible ? 'Hide' : 'Show'"
        @click.stop="$emit('toggle-visible', node.id)"
      >
        <Icon
          :name="node.visible ? 'lucide:eye' : 'lucide:eye-off'"
          class="act-icon"
          size="14"
        />
      </button>
      <button
        v-if="!node.isRoot"
        type="button"
        class="act danger"
        title="Delete"
        @click.stop="$emit('remove', node.id)"
      >
        <Icon name="lucide:trash-2" class="act-icon" size="14" />
      </button>
    </div>
    <ul v-if="node.children.length" class="nested">
      <SvgStudioLayerItem
        v-for="child in node.children"
        :key="child.id"
        :node="child"
        :selected-id="selectedId"
        @select="$emit('select', $event)"
        @toggle-visible="$emit('toggle-visible', $event)"
        @remove="$emit('remove', $event)"
      />
    </ul>
  </li>
</template>

<script setup lang="ts">
import type { DomLayerNode } from './domLayerTypes'
// Explicit self-import so nested tree resolves (Nuxt auto-name is EditorSvgStudioLayerItem)
import SvgStudioLayerItem from './SvgStudioLayerItem.vue'

defineProps<{
  node: DomLayerNode
  selectedId: string
}>()

defineEmits<{
  select: [id: string]
  'toggle-visible': [id: string]
  remove: [id: string]
}>()
</script>

<style scoped>
.layer-item {
  list-style: none;
}

.nested {
  list-style: none;
  margin: 0;
  padding: 0;
}

.row {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.35rem 0.55rem;
  cursor: pointer;
  font-size: 0.82rem;
  color: var(--sf-text);
}

.row.root {
  font-weight: 650;
  border-bottom: 1px solid rgba(15, 23, 42, 0.06);
  margin-bottom: 0.15rem;
}

.row:hover {
  background: rgba(37, 99, 235, 0.06);
}

.row.selected {
  background: rgba(37, 99, 235, 0.12);
}

.tag {
  font-weight: 700;
  font-size: 0.78rem;
}

.idx {
  color: var(--sf-muted);
  font-size: 0.75rem;
}

.spacer {
  flex: 1;
}

.act {
  appearance: none;
  border: none;
  background: transparent;
  cursor: pointer;
  opacity: 0;
  padding: 0.15rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--sf-muted);
}

.act-icon {
  display: block;
}

.row:hover .act,
.row.selected .act,
.row.root .act {
  opacity: 0.9;
}

.act:hover {
  color: var(--sf-text);
}

.act.danger:hover {
  color: #dc2626;
}
</style>
