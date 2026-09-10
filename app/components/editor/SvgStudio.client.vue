<template>
  <div class="studio">
    <header class="topbar">
      <div class="top-left">
        <label class="tb-btn">
          Upload
          <input type="file" accept=".svg,image/svg+xml" @change="onUpload" />
        </label>
        <button type="button" class="tb-btn" @click="onPaste">Paste</button>
      </div>
      <div class="top-meta">
        <strong>{{ fileName }}</strong>
        <span>{{ displayW }} × {{ displayH }}</span>
        <span>{{ fileSizeLabel }}</span>
      </div>
      <div class="top-right">
        <button type="button" class="tb-btn" :disabled="!canUndo" @click="undo">Undo</button>
        <button type="button" class="tb-btn" :disabled="!canRedo" @click="redo">Redo</button>
        <button type="button" class="tb-btn danger" :disabled="!svgCode" @click="resetAll">Reset</button>
        <button type="button" class="tb-btn solid" :disabled="!svgCode" @click="downloadFormat('svg')">
          Download SVG
        </button>
      </div>
    </header>

    <div class="body">
      <aside class="panel layers-panel">
        <div class="panel-head">
          <span>Layers</span>
          <span class="badge">{{ layerCount }}</span>
        </div>
        <div v-if="!layers.length" class="empty">Load an SVG to see layers</div>
        <ul v-else class="layer-tree">
          <SvgStudioLayerItem
            v-for="node in layers"
            :key="node.id"
            :node="node"
            :selected-id="selectedId"
            @select="selectLayer"
            @toggle-visible="toggleVisible"
            @remove="removeLayer"
          />
        </ul>
      </aside>

      <section class="artboard">
        <div class="artboard-bar">
          <div class="bg-group">
            <span class="bar-label">Artboard BG</span>
            <button
              type="button"
              class="bg-swatch checker"
              :class="{ active: artboardBg === 'checker' }"
              title="Transparent"
              @click="artboardBg = 'checker'"
            />
            <button
              type="button"
              class="bg-swatch"
              :class="{ active: artboardBg === 'white' }"
              style="background: #fff"
              title="White"
              @click="artboardBg = 'white'"
            />
            <button
              type="button"
              class="bg-swatch"
              :class="{ active: artboardBg === 'dark' }"
              style="background: #0f172a"
              title="Dark"
              @click="artboardBg = 'dark'"
            />
          </div>
          <div class="zoom-group">
            <button type="button" class="icon-btn" @click="bumpZoom(-0.1)">−</button>
            <span class="zoom-label">{{ Math.round(zoom * 100) }}%</span>
            <button type="button" class="icon-btn" @click="bumpZoom(0.1)">+</button>
            <button type="button" class="icon-btn" title="Fit" @click="zoom = 1">⤢</button>
          </div>
        </div>

        <div
          class="viewport"
          :class="[`bg-${artboardBg}`]"
          @wheel.prevent="onWheel"
          @click="onViewportClick"
        >
          <div
            ref="stageRef"
            class="stage"
            :class="[`stage-${artboardBg}`]"
            :style="{ width: `${stagePx}px`, height: `${stagePx}px` }"
            @click.stop
          >
            <div
              ref="svgHostRef"
              class="svg-host"
              :class="{
                'has-selection': !!selectedId && selectedId !== svgRootId,
                'root-selected': selectedId === svgRootId,
                interacting: !!interaction,
              }"
              v-html="annotatedSvg"
              @pointerdown.capture="onSvgPointerDown"
            />
            <div
              v-if="shapeOutline"
              class="shape-outline-box"
              :class="{ interacting: !!interaction }"
              :style="{
                left: `${shapeOutline.left}px`,
                top: `${shapeOutline.top}px`,
                width: `${shapeOutline.width}px`,
                height: `${shapeOutline.height}px`,
              }"
            >
              <button
                v-for="h in resizeHandles"
                :key="h"
                type="button"
                class="resize-handle"
                :class="h"
                :title="`Resize ${h.toUpperCase()}`"
                @pointerdown.stop.prevent="onResizePointerDown($event, h)"
              />
            </div>
          </div>
          <p v-if="error" class="stage-banner error">{{ error }}</p>
          <p v-else-if="!svgCode" class="stage-banner">Upload or paste an SVG to start</p>
          <p v-else class="stage-banner tip">Drag to move · handles to resize · Shift locks aspect</p>
        </div>
      </section>

      <aside class="panel inspector-panel">
        <div class="panel-head"><span>Inspector</span></div>

        <template v-if="svgCode">
          <div class="insp-section">
            <h3>Size</h3>
            <div class="size-presets">
              <button
                v-for="s in sizePresets"
                :key="s"
                type="button"
                class="preset"
                :class="{ on: Math.round(insp.w) === s }"
                @click="applyPresetSize(s)"
              >
                {{ s }}
              </button>
            </div>
            <div class="wh-row">
              <label>
                W
                <input v-model.number="insp.w" type="number" min="16" max="1024" @change="applySize" />
              </label>
              <button
                type="button"
                class="icon-btn lock"
                :class="{ on: insp.lockRatio }"
                title="Lock aspect ratio"
                @click="insp.lockRatio = !insp.lockRatio"
              >
                {{ insp.lockRatio ? '⛓' : '🔓' }}
              </button>
              <label>
                H
                <input v-model.number="insp.h" type="number" min="16" max="1024" @change="applySize" />
              </label>
            </div>
            <input v-model.number="insp.scalePct" type="range" min="25" max="300" step="1" @input="applyScalePct" />
          </div>

          <div class="insp-section">
            <h3>Colors</h3>
            <p v-if="selectedId && selectedId !== svgRootId" class="sel-hint">Editing: {{ selectedId }}</p>
            <p v-else class="sel-hint">Editing: SVG Root (all shapes)</p>
            <div class="color-block">
              <span>Fill</span>
              <div class="color-row">
                <input v-model="insp.fill" type="color" :disabled="insp.fillNone" @input="applyColors" />
                <button type="button" class="none-btn" :class="{ on: insp.fillNone }" @click="toggleFillNone">
                  Ø
                </button>
              </div>
            </div>
            <div class="color-block">
              <span>Stroke</span>
              <div class="color-row">
                <input v-model="insp.stroke" type="color" :disabled="insp.strokeNone" @input="applyColors" />
                <button type="button" class="none-btn" :class="{ on: insp.strokeNone }" @click="toggleStrokeNone">
                  Ø
                </button>
              </div>
            </div>
            <label v-if="!insp.strokeNone" class="field">
              Stroke width {{ insp.strokeWidth }}
              <input
                v-model.number="insp.strokeWidth"
                type="range"
                min="0"
                max="12"
                step="0.5"
                @input="applyColors"
              />
            </label>
          </div>

          <div class="insp-section">
            <h3>Opacity</h3>
            <div class="slider-row">
              <input v-model.number="insp.opacity" type="range" min="0" max="100" @input="applyOpacity" />
              <input
                v-model.number="insp.opacity"
                class="num"
                type="number"
                min="0"
                max="100"
                @change="applyOpacity"
              />
            </div>
          </div>

          <div class="insp-section">
            <h3>Border radius</h3>
            <p class="sel-hint">{{ radiusHint }}</p>
            <div class="slider-row">
              <input
                v-model.number="insp.radius"
                type="range"
                min="0"
                :max="radiusMax"
                step="0.5"
                @input="applyRadius"
              />
              <input
                v-model.number="insp.radius"
                class="num"
                type="number"
                min="0"
                :max="radiusMax"
                step="0.5"
                @change="applyRadius"
              />
            </div>
          </div>

          <div class="insp-section">
            <h3>Rotate &amp; Flip</h3>
            <div class="rotate-btns">
              <button type="button" class="icon-btn" title="-90°" @click="rotateBy(-90)">↺</button>
              <button type="button" class="icon-btn" title="+90°" @click="rotateBy(90)">↻</button>
              <button type="button" class="icon-btn" title="Flip H" @click="flip('x')">↔</button>
              <button type="button" class="icon-btn" title="Flip V" @click="flip('y')">↕</button>
            </div>
            <div class="slider-row">
              <input v-model.number="insp.angle" type="range" min="0" max="360" @input="applyRootTransform" />
              <input
                v-model.number="insp.angle"
                class="num"
                type="number"
                min="0"
                max="360"
                @change="applyRootTransform"
              />
            </div>
          </div>
        </template>
        <p v-else class="empty">Load an SVG to inspect properties</p>
      </aside>
    </div>

    <footer class="bottombar">
      <div class="format-row">
        <div v-for="fmt in codeFormats" :key="fmt.id" class="fmt-chip">
          <span>{{ fmt.label }}</span>
          <button type="button" class="mini" @click="copyFormat(fmt.id)">Copy</button>
          <button type="button" class="mini" @click="downloadFormat(fmt.id)">↓</button>
        </div>
      </div>
      <div class="raster-row">
        <select v-model="rasterFmt">
          <option value="png">PNG</option>
          <option value="webp">WEBP</option>
        </select>
        <select v-model.number="rasterScale">
          <option :value="1">1x</option>
          <option :value="2">2x</option>
          <option :value="3">3x</option>
          <option :value="4">4x</option>
        </select>
        <button type="button" class="tb-btn solid" @click="downloadRaster">Download</button>
        <button type="button" class="tb-btn" :class="{ on: showCode }" @click="showCode = !showCode">
          {{ showCode ? 'Hide Code' : 'Show Code' }}
        </button>
      </div>
    </footer>

    <div v-if="showCode" class="code-drawer">
      <div class="code-tabs">
        <button
          v-for="fmt in codeFormats"
          :key="fmt.id"
          type="button"
          class="tab"
          :class="{ active: codeTab === fmt.id }"
          @click="codeTab = fmt.id"
        >
          {{ fmt.label }}
        </button>
      </div>
      <pre>{{ formatOutput(codeTab) }}</pre>
    </div>

    <p v-if="toast" class="toast">{{ toast }}</p>
  </div>
</template>

<script setup lang="ts">
/**
 * OpenSVG-style DOM SVG editor:
 * - DOMParser / XMLSerializer
 * - data-editor-id on nodes
 * - g[data-editor-type=transform-wrapper] for root rotate/flip
 * - v-html renders real <svg> (visible in DevTools)
 * - Canvas 2D only for PNG export
 */
import type { DomLayerNode } from './domLayerTypes'
import { SVG_ROOT_ID } from './domLayerTypes'
import SvgStudioLayerItem from './SvgStudioLayerItem.vue'
import {
  RESIZE_HANDLES,
  clientToParentLocal,
  elementScreenRect,
  moveTransform,
  resizeTransform,
  scaleFromScreenDrag,
  type ResizeHandle,
  type SvgBBox,
  type SvgPoint,
} from './svgInteract'

const emit = defineEmits<{
  ready: []
  loaded: [meta: { name: string; bytes: number }]
}>()

const WRAPPER = 'transform-wrapper'
const CORNER_CLIP_ID = 'sf-corner-clip'
const STAGE_BASE = 520
const svgRootId = SVG_ROOT_ID

const svgCode = ref('')
const originalSvg = ref('')
const fileName = ref('untitled.svg')
const fileBytes = ref(0)
const error = ref('')
const artboardBg = ref<'checker' | 'white' | 'dark'>('checker')
const zoom = ref(1)
const selectedId = ref('')
const layers = ref<DomLayerNode[]>([])
const stageRef = ref<HTMLElement | null>(null)
const svgHostRef = ref<HTMLElement | null>(null)
const shapeOutline = ref<{ left: number; top: number; width: number; height: number } | null>(null)
const resizeHandles = RESIZE_HANDLES
const showCode = ref(false)
const codeTab = ref<'svg' | 'jsx' | 'tsx' | 'html' | 'css' | 'datauri'>('svg')
const rasterFmt = ref<'png' | 'webp'>('png')
const rasterScale = ref(2)
const toast = ref('')

const insp = reactive({
  w: 24,
  h: 24,
  lockRatio: true,
  scalePct: 100,
  fill: '#1a2332',
  fillNone: false,
  stroke: '#1a2332',
  strokeNone: true,
  strokeWidth: 2,
  opacity: 100,
  radius: 0,
  angle: 0,
  flipX: false,
  flipY: false,
  baseW: 24,
  baseH: 24,
})

let history: string[] = []
let historyIndex = -1
let toastTimer: ReturnType<typeof setTimeout> | null = null

type Interaction = {
  mode: 'move' | 'resize'
  id: string
  pointerId: number
  handle?: ResizeHandle
  origTransform: string
  startClient: SvgPoint
  startLocal: SvgPoint
  bbox: SvgBBox
  startRect: { left: number; top: number; width: number; height: number }
  moved: boolean
  keepAspect: boolean
  /** Snapshot of annotated SVG at gesture start; keeps v-html stable mid-drag. */
  frozenMarkup: string
}

const interaction = shallowRef<Interaction | null>(null)
const DRAG_THRESHOLD_PX = 3

const SKIP = new Set([
  'defs',
  'clippath',
  'mask',
  'lineargradient',
  'radialgradient',
  'filter',
  'style',
  'script',
  'title',
  'desc',
  'metadata',
  'symbol',
  'marker',
  'pattern',
  'stop',
])

const codeFormats = [
  { id: 'svg' as const, label: 'SVG' },
  { id: 'jsx' as const, label: 'JSX' },
  { id: 'tsx' as const, label: 'TSX' },
  { id: 'html' as const, label: 'HTML' },
  { id: 'css' as const, label: 'CSS' },
  { id: 'datauri' as const, label: 'Data URI' },
]

const sizePresets = [24, 32, 48, 64, 128, 256] as const

const layerCount = computed(() => {
  if (!layers.value.length) return 0
  // Badge counts drawable layers under SVG Root (exclude the root row itself)
  return countLayers(layers.value) - layers.value.filter((n) => n.isRoot).length
})
const canUndo = computed(() => historyIndex > 0)
const canRedo = computed(() => historyIndex >= 0 && historyIndex < history.length - 1)
const fileSizeLabel = computed(() => {
  if (!fileBytes.value) return '—'
  if (fileBytes.value < 1024) return `${fileBytes.value} B`
  return `${(fileBytes.value / 1024).toFixed(2)} KB`
})
const displayW = computed(() => Math.round(insp.w))
const displayH = computed(() => Math.round(insp.h))
const stagePx = computed(() => Math.round(STAGE_BASE * zoom.value))
const radiusMax = computed(() => Math.max(1, Math.round(Math.min(insp.baseW, insp.baseH) / 2)))
const radiusHint = computed(() => {
  if (selectedId.value && selectedId.value !== SVG_ROOT_ID) {
    const node = findLayer(selectedId.value)
    if (node?.type === 'rect') return 'Editing selected rect corners (rx / ry)'
  }
  return 'Clipping whole icon with rounded corners'
})

/** Annotated markup for display (root dashed box; shape outline is a separate HTML overlay). */
const annotatedSvg = computed(() => {
  // Freeze markup while dragging so v-html does not wipe live DOM mutations.
  if (interaction.value?.frozenMarkup) return interaction.value.frozenMarkup

  if (!svgCode.value) return ''
  try {
    const doc = new DOMParser().parseFromString(svgCode.value, 'image/svg+xml')
    const svg = doc.querySelector('svg')
    if (!svg) return svgCode.value

    if (selectedId.value === SVG_ROOT_ID) {
      svg.setAttribute('data-editor-selected', 'root')
      appendRootSelectionBox(doc, svg)
    } else if (selectedId.value) {
      const hit = doc.querySelector(`[data-editor-id="${CSS.escape(selectedId.value)}"]`)
      if (hit) hit.setAttribute('data-editor-selected', '1')
    }

    return new XMLSerializer().serializeToString(svg)
  } catch {
    return svgCode.value
  }
})

/** OpenSVG-style dashed bounds around the whole SVG (display-only overlay). */
function appendRootSelectionBox(doc: Document, svg: Element) {
  const existing = svg.querySelector('[data-editor-overlay="root-bounds"]')
  existing?.parentNode?.removeChild(existing)

  const vb = readViewBox(svg)
  const unit = Math.max(vb.w, vb.h) / 24
  const pad = 0.4 * unit

  const rect = doc.createElementNS('http://www.w3.org/2000/svg', 'rect')
  rect.setAttribute('data-editor-overlay', 'root-bounds')
  rect.setAttribute('x', String(vb.x - pad))
  rect.setAttribute('y', String(vb.y - pad))
  rect.setAttribute('width', String(vb.w + pad * 2))
  rect.setAttribute('height', String(vb.h + pad * 2))
  rect.setAttribute('fill', 'none')
  rect.setAttribute('stroke', '#6366f1')
  rect.setAttribute('stroke-width', '1.5')
  rect.setAttribute('stroke-dasharray', '5 4')
  rect.setAttribute('stroke-linecap', 'square')
  rect.setAttribute('pointer-events', 'none')
  rect.setAttribute('vector-effect', 'non-scaling-stroke')
  svg.appendChild(rect)
}

/** Outer dashed outline around the selected shape's screen bbox (stroke-inclusive). */
function updateShapeOutline() {
  shapeOutline.value = null
  const id = selectedId.value
  if (!id || id === SVG_ROOT_ID) return

  const stage = stageRef.value
  const host = svgHostRef.value
  if (!stage || !host) return

  const el = host.querySelector(`[data-editor-id="${CSS.escape(id)}"]`) as SVGGraphicsElement | null
  if (!el) return

  const sr = stage.getBoundingClientRect()
  // getBoundingClientRect omits stroke on many fill="none" icons — use stroke-aware bounds.
  const er = elementScreenRect(el)
  if (er.width <= 0 && er.height <= 0) return

  const pad = 3
  shapeOutline.value = {
    left: er.left - sr.left - pad,
    top: er.top - sr.top - pad,
    width: Math.max(2, er.width + pad * 2),
    height: Math.max(2, er.height + pad * 2),
  }
}

async function refreshShapeOutline() {
  await nextTick()
  requestAnimationFrame(() => updateShapeOutline())
}

watch([selectedId, annotatedSvg, zoom, stagePx], () => {
  void refreshShapeOutline()
})

function isRootOrNone(id = selectedId.value) {
  return !id || id === SVG_ROOT_ID
}

function countLayers(nodes: DomLayerNode[]): number {
  return nodes.reduce((n, node) => n + 1 + countLayers(node.children), 0)
}

function showToast(msg: string) {
  toast.value = msg
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toast.value = ''
  }, 1600)
}

function normalizeMarkup(raw: string): string {
  let s = raw.trim()
  if (!/<svg[\s>]/i.test(s)) {
    s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">${s}</svg>`
  }
  if (!/\sxmlns=/i.test(s)) {
    s = s.replace(/<svg\b/i, '<svg xmlns="http://www.w3.org/2000/svg"')
  }
  return s.replace(/currentColor/gi, '#1a2332')
}

/** OpenSVG-style: ensure ids + transform-wrapper */
function prepareEditorDoc(markup: string): { svg: SVGSVGElement; serialized: string; vbW: number; vbH: number } {
  const doc = new DOMParser().parseFromString(normalizeMarkup(markup), 'image/svg+xml')
  if (doc.querySelector('parsererror')) throw new Error('Invalid SVG markup')
  const svg = doc.querySelector('svg')
  if (!svg) throw new Error('Root element must be <svg>')

  // Assign data-editor-id (root svg + descendants)
  svg.setAttribute('data-editor-id', SVG_ROOT_ID)
  let n = 1
  svg.querySelectorAll('*').forEach((el) => {
    if (el === svg) return
    if (!el.getAttribute('data-editor-id')) {
      el.setAttribute('data-editor-id', `${el.tagName.toLowerCase()}-${n++}`)
    }
  })

  // Ensure transform wrapper (OpenSVG pattern)
  let wrap = svg.querySelector(`g[data-editor-type="${WRAPPER}"]`) as SVGGElement | null
  if (!wrap) {
    wrap = doc.createElementNS('http://www.w3.org/2000/svg', 'g')
    wrap.setAttribute('data-editor-type', WRAPPER)
    wrap.setAttribute('data-editor-id', 'g-transform')
    const move: Node[] = []
    Array.from(svg.childNodes).forEach((node) => {
      if (node.nodeType !== 1) {
        move.push(node)
        return
      }
      const tag = (node as Element).tagName.toLowerCase()
      if (tag === 'defs' || tag === 'style' || tag === 'metadata' || tag === 'title' || tag === 'desc') return
      move.push(node)
    })
    move.forEach((node) => wrap!.appendChild(node))
    svg.appendChild(wrap)
  }

  // ViewBox / intrinsic size
  let vbW = 24
  let vbH = 24
  const vb = svg.getAttribute('viewBox')
  if (vb) {
    const p = vb.trim().split(/[\s,]+/).map(Number)
    if (p.length === 4 && p[2] > 0 && p[3] > 0) {
      vbW = p[2]
      vbH = p[3]
    }
  } else {
    const w = parseFloat(svg.getAttribute('width') || '')
    const h = parseFloat(svg.getAttribute('height') || '')
    if (w > 0) vbW = w
    if (h > 0) vbH = h
    svg.setAttribute('viewBox', `0 0 ${vbW} ${vbH}`)
  }

  // Display fills stage
  svg.setAttribute('width', '100%')
  svg.setAttribute('height', '100%')
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet')
  if (!svg.getAttribute('xmlns')) svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg')

  return {
    svg,
    serialized: new XMLSerializer().serializeToString(svg),
    vbW,
    vbH,
  }
}

function parseLive(): Document {
  return new DOMParser().parseFromString(svgCode.value, 'image/svg+xml')
}

function commitDoc(doc: Document, record = true) {
  const svg = doc.querySelector('svg')
  if (!svg) return
  svgCode.value = new XMLSerializer().serializeToString(svg)
  fileBytes.value = new TextEncoder().encode(svgCode.value).length
  rebuildLayers(doc)
  if (record) pushHistory()
}

function rebuildLayers(doc?: Document) {
  const d = doc || parseLive()
  const svg = d.querySelector('svg')
  if (!svg) {
    layers.value = []
    return
  }
  const wrap = svg.querySelector(`g[data-editor-type="${WRAPPER}"]`) || svg
  const children = buildTree(wrap, 1, { n: 0 })
  layers.value = [
    {
      id: SVG_ROOT_ID,
      label: 'SVG',
      type: 'svg',
      indexLabel: 'Root',
      visible: wrap.getAttribute('display') !== 'none' && wrap.getAttribute('visibility') !== 'hidden',
      depth: 0,
      isRoot: true,
      children,
    },
  ]
}

function buildTree(parent: Element, depth: number, counter: { n: number }): DomLayerNode[] {
  const out: DomLayerNode[] = []
  for (const child of Array.from(parent.children)) {
    const tag = child.tagName.toLowerCase()
    if (SKIP.has(tag)) continue
    if (child.getAttribute('data-editor-type') === WRAPPER) {
      // flatten: show wrapper children at this level
      out.push(...buildTree(child, depth, counter))
      continue
    }
    counter.n += 1
    const id = child.getAttribute('data-editor-id') || `${tag}-${counter.n}`
    out.push({
      id,
      label: tag.toUpperCase(),
      type: tag,
      indexLabel: `#${counter.n}`,
      visible: child.getAttribute('display') !== 'none' && child.getAttribute('visibility') !== 'hidden',
      depth,
      children: buildTree(child, depth + 1, counter),
    })
  }
  return out
}

function findLayer(id: string, nodes = layers.value): DomLayerNode | null {
  for (const n of nodes) {
    if (n.id === id) return n
    const hit = findLayer(id, n.children)
    if (hit) return hit
  }
  return null
}

function pushHistory() {
  history = history.slice(0, historyIndex + 1)
  history.push(svgCode.value)
  if (history.length > 50) history.shift()
  historyIndex = history.length - 1
}

function undo() {
  if (!canUndo.value) return
  historyIndex -= 1
  svgCode.value = history[historyIndex]
  rebuildLayers()
  syncInspFromSelection()
}

function redo() {
  if (!canRedo.value) return
  historyIndex += 1
  svgCode.value = history[historyIndex]
  rebuildLayers()
  syncInspFromSelection()
}

async function loadSvgString(raw: string, name = 'untitled.svg') {
  error.value = ''
  try {
    const prepared = prepareEditorDoc(raw)
    svgCode.value = prepared.serialized
    originalSvg.value = prepared.serialized
    fileName.value = name
    fileBytes.value = new TextEncoder().encode(prepared.serialized).length
    insp.baseW = prepared.vbW
    insp.baseH = prepared.vbH
    insp.w = prepared.vbW
    insp.h = prepared.vbH
    insp.scalePct = 100
    insp.angle = 0
    insp.flipX = false
    insp.flipY = false
    insp.radius = 0
    selectedId.value = ''
    rebuildLayers()
    history = [svgCode.value]
    historyIndex = 0
    selectLayer(SVG_ROOT_ID)
    emit('loaded', { name, bytes: fileBytes.value })
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Failed to load SVG'
  }
}

function hitEditorId(start: Element | null, root: EventTarget | null): string | null {
  let el: Element | null = start
  while (el && el !== root) {
    const id = el.getAttribute?.('data-editor-id')
    const tag = el.tagName?.toLowerCase()
    if (id && tag && tag !== 'svg' && id !== SVG_ROOT_ID && el.getAttribute('data-editor-type') !== WRAPPER) {
      return id
    }
    el = el.parentElement
  }
  return null
}

function liveElement(id: string): SVGGraphicsElement | null {
  const host = svgHostRef.value
  if (!host) return null
  return host.querySelector(`[data-editor-id="${CSS.escape(id)}"]`) as SVGGraphicsElement | null
}

function commitLiveHost(record = true) {
  const host = svgHostRef.value
  const live = host?.querySelector('svg')
  if (!live) return

  const clone = live.cloneNode(true) as Element
  clone.querySelectorAll('[data-editor-overlay]').forEach((el) => el.parentNode?.removeChild(el))
  clone.querySelectorAll('[data-editor-selected]').forEach((el) => el.removeAttribute('data-editor-selected'))

  svgCode.value = new XMLSerializer().serializeToString(clone)
  fileBytes.value = new TextEncoder().encode(svgCode.value).length
  rebuildLayers()
  if (record) pushHistory()
}

function beginInteraction(
  mode: 'move' | 'resize',
  id: string,
  e: PointerEvent,
  handle?: ResizeHandle,
) {
  const el = liveElement(id)
  if (!el) return

  let bbox: SvgBBox = { x: 0, y: 0, width: 1, height: 1 }
  try {
    const b = el.getBBox()
    if (b.width > 0 || b.height > 0) {
      bbox = { x: b.x, y: b.y, width: Math.max(b.width, 0.01), height: Math.max(b.height, 0.01) }
    }
  } catch {
    /* getBBox can throw on detached/invisible nodes */
  }

  const rect = elementScreenRect(el)
  const startLocal = clientToParentLocal(el, e.clientX, e.clientY)

  interaction.value = {
    mode,
    id,
    pointerId: e.pointerId,
    handle,
    origTransform: el.getAttribute('transform') || '',
    startClient: { x: e.clientX, y: e.clientY },
    startLocal,
    bbox,
    startRect: { left: rect.left, top: rect.top, width: Math.max(rect.width, 1), height: Math.max(rect.height, 1) },
    moved: false,
    keepAspect: e.shiftKey,
    frozenMarkup: annotatedSvg.value,
  }

  window.addEventListener('pointermove', onInteractionMove)
  window.addEventListener('pointerup', onInteractionEnd)
  window.addEventListener('pointercancel', onInteractionEnd)
  try {
    svgHostRef.value?.setPointerCapture(e.pointerId)
  } catch {
    /* ignore */
  }
}

async function onSvgPointerDown(e: PointerEvent) {
  if (e.button !== 0) return
  if (interaction.value) return

  const host = svgHostRef.value
  const id = hitEditorId(e.target as Element | null, e.currentTarget)
  if (!id || !host) return

  e.preventDefault()
  e.stopPropagation()

  if (selectedId.value !== id) {
    selectLayer(id)
    await nextTick()
    await refreshShapeOutline()
  }

  // Pointer released while waiting for selection paint
  if (e.buttons === 0) return

  beginInteraction('move', id, e)
}

function onResizePointerDown(e: PointerEvent, handle: ResizeHandle) {
  if (e.button !== 0) return
  const id = selectedId.value
  if (!id || id === SVG_ROOT_ID) return
  e.preventDefault()
  e.stopPropagation()
  beginInteraction('resize', id, e, handle)
}

function onInteractionMove(e: PointerEvent) {
  const sess = interaction.value
  if (!sess || e.pointerId !== sess.pointerId) return

  const el = liveElement(sess.id)
  if (!el) return

  sess.keepAspect = e.shiftKey

  const screenDist = Math.hypot(e.clientX - sess.startClient.x, e.clientY - sess.startClient.y)
  if (!sess.moved && screenDist < DRAG_THRESHOLD_PX) return
  sess.moved = true

  if (sess.mode === 'move') {
    const cur = clientToParentLocal(el, e.clientX, e.clientY)
    const dx = cur.x - sess.startLocal.x
    const dy = cur.y - sess.startLocal.y
    const next = moveTransform(sess.origTransform, dx, dy)
    if (next) el.setAttribute('transform', next)
    else el.removeAttribute('transform')
  } else if (sess.handle) {
    const { sx, sy } = scaleFromScreenDrag(sess.handle, sess.startRect, e.clientX, e.clientY, sess.keepAspect)
    const next = resizeTransform(sess.origTransform, sess.bbox, sess.handle, sx, sy)
    if (next) el.setAttribute('transform', next)
    else el.removeAttribute('transform')
  }

  updateShapeOutline()
}

function onInteractionEnd(e: PointerEvent) {
  const sess = interaction.value
  if (!sess || e.pointerId !== sess.pointerId) return

  window.removeEventListener('pointermove', onInteractionMove)
  window.removeEventListener('pointerup', onInteractionEnd)
  window.removeEventListener('pointercancel', onInteractionEnd)
  try {
    if (svgHostRef.value?.hasPointerCapture(e.pointerId)) {
      svgHostRef.value.releasePointerCapture(e.pointerId)
    }
  } catch {
    /* ignore */
  }

  const didMove = sess.moved
  // Commit while markup is still frozen so v-html does not wipe live transforms.
  if (didMove) {
    commitLiveHost(true)
  }
  interaction.value = null
  if (didMove) void refreshShapeOutline()
}

function onViewportClick() {
  if (interaction.value) return
  selectLayer(SVG_ROOT_ID)
}

function selectLayer(id: string) {
  // Clicking SVG Root again toggles the dashed root bounds off (OpenSVG-like)
  if (id === SVG_ROOT_ID && selectedId.value === SVG_ROOT_ID) {
    selectedId.value = ''
    syncInspFromSelection()
    return
  }
  selectedId.value = id
  syncInspFromSelection()
}

function syncInspFromSelection() {
  if (!svgCode.value) return
  const doc = parseLive()
  const el =
    !isRootOrNone() && selectedId.value
      ? doc.querySelector(`[data-editor-id="${CSS.escape(selectedId.value)}"]`)
      : null

  const sample =
    el ||
    doc.querySelector(`g[data-editor-type="${WRAPPER}"] path, g[data-editor-type="${WRAPPER}"] > *`) ||
    doc.querySelector('path, rect, circle, ellipse, polygon, polyline, line')

  if (sample) {
    const fill = sample.getAttribute('fill')
    if (!fill || fill === 'none') {
      insp.fillNone = fill === 'none'
      if (fill !== 'none') {
        insp.fillNone = false
        insp.fill = '#1a2332'
      }
    } else if (fill.startsWith('#')) {
      insp.fill = fill.slice(0, 7)
      insp.fillNone = false
    }

    const stroke = sample.getAttribute('stroke')
    if (!stroke || stroke === 'none') {
      insp.strokeNone = true
    } else if (stroke.startsWith('#')) {
      insp.stroke = stroke.slice(0, 7)
      insp.strokeNone = false
    }
    const sw = parseFloat(sample.getAttribute('stroke-width') || '')
    if (!Number.isNaN(sw)) insp.strokeWidth = sw

    const op = parseFloat(sample.getAttribute('opacity') || '1')
    insp.opacity = Math.round((Number.isNaN(op) ? 1 : op) * 100)
  }

  // Border radius: selected rect rx, else corner clip
  if (el && el.tagName.toLowerCase() === 'rect') {
    const rx = parseFloat(el.getAttribute('rx') || el.getAttribute('ry') || '0')
    insp.radius = Number.isNaN(rx) ? 0 : Math.max(0, rx)
  } else {
    const clipRect = doc.querySelector(`#${CORNER_CLIP_ID} rect`)
    const rx = parseFloat(clipRect?.getAttribute('rx') || '0')
    insp.radius = Number.isNaN(rx) ? 0 : Math.max(0, rx)
  }

  // Root transform from wrapper
  const wrap = doc.querySelector(`g[data-editor-type="${WRAPPER}"]`)
  const tf = wrap?.getAttribute('transform') || ''
  const rot = tf.match(/rotate\(\s*([-.\d]+)/)
  insp.angle = rot ? Math.round(((parseFloat(rot[1]) % 360) + 360) % 360) : 0
  insp.flipX = /scale\(\s*-1(?:[\s,)]|$)/.test(tf)
  insp.flipY = /scale\([^)]*-1\s*\)$/.test(tf) || /scale\(\s*[^,)]+[\s,]+-1/.test(tf)
}

function eachTarget(doc: Document, fn: (el: Element) => void) {
  if (!isRootOrNone()) {
    const el = doc.querySelector(`[data-editor-id="${CSS.escape(selectedId.value)}"]`)
    if (el && el.getAttribute('data-editor-id') !== SVG_ROOT_ID) fn(el)
    return
  }
  const wrap = doc.querySelector(`g[data-editor-type="${WRAPPER}"]`) || doc.querySelector('svg')
  if (!wrap) return
  wrap.querySelectorAll('path,rect,circle,ellipse,polygon,polyline,line,text,g').forEach((el) => {
    if (el.getAttribute('data-editor-type') === WRAPPER) return
    if (SKIP.has(el.tagName.toLowerCase())) return
    fn(el)
  })
}

function applyColors() {
  const doc = parseLive()
  eachTarget(doc, (el) => {
    if (insp.fillNone) el.setAttribute('fill', 'none')
    else el.setAttribute('fill', insp.fill)
    if (insp.strokeNone) {
      el.setAttribute('stroke', 'none')
      el.removeAttribute('stroke-width')
    } else {
      el.setAttribute('stroke', insp.stroke)
      el.setAttribute('stroke-width', String(insp.strokeWidth))
    }
  })
  commitDoc(doc)
}

function toggleFillNone() {
  insp.fillNone = !insp.fillNone
  applyColors()
}
function toggleStrokeNone() {
  insp.strokeNone = !insp.strokeNone
  applyColors()
}

function applyOpacity() {
  const doc = parseLive()
  const v = String(Math.min(100, Math.max(0, insp.opacity)) / 100)
  eachTarget(doc, (el) => el.setAttribute('opacity', v))
  commitDoc(doc)
}

function readViewBox(svg: Element): { x: number; y: number; w: number; h: number } {
  const vb = (svg.getAttribute('viewBox') || '0 0 24 24').trim().split(/[\s,]+/).map(Number)
  return {
    x: vb[0] || 0,
    y: vb[1] || 0,
    w: vb[2] || 24,
    h: vb[3] || 24,
  }
}

function applyRadius() {
  const doc = parseLive()
  const svg = doc.querySelector('svg')
  if (!svg) return
  const r = Math.max(0, Math.min(radiusMax.value, Number(insp.radius) || 0))
  insp.radius = r

  const selected =
    !isRootOrNone() && selectedId.value
      ? doc.querySelector(`[data-editor-id="${CSS.escape(selectedId.value)}"]`)
      : null

  if (selected && selected.tagName.toLowerCase() === 'rect') {
    if (r <= 0) {
      selected.removeAttribute('rx')
      selected.removeAttribute('ry')
    } else {
      selected.setAttribute('rx', String(r))
      selected.setAttribute('ry', String(r))
    }
    commitDoc(doc)
    return
  }

  const wrap = doc.querySelector(`g[data-editor-type="${WRAPPER}"]`) as SVGGElement | null
  if (!wrap) return

  let defs = svg.querySelector('defs')
  if (!defs) {
    defs = doc.createElementNS('http://www.w3.org/2000/svg', 'defs')
    svg.insertBefore(defs, svg.firstChild)
  }

  let clip = defs.querySelector(`#${CORNER_CLIP_ID}`) as SVGClipPathElement | null
  if (r <= 0) {
    wrap.removeAttribute('clip-path')
    clip?.parentNode?.removeChild(clip)
    commitDoc(doc)
    return
  }

  if (!clip) {
    clip = doc.createElementNS('http://www.w3.org/2000/svg', 'clipPath') as SVGClipPathElement
    clip.setAttribute('id', CORNER_CLIP_ID)
    defs.appendChild(clip)
  }

  let rect = clip.querySelector('rect')
  if (!rect) {
    rect = doc.createElementNS('http://www.w3.org/2000/svg', 'rect')
    clip.appendChild(rect)
  }

  const vb = readViewBox(svg)
  rect.setAttribute('x', String(vb.x))
  rect.setAttribute('y', String(vb.y))
  rect.setAttribute('width', String(vb.w))
  rect.setAttribute('height', String(vb.h))
  rect.setAttribute('rx', String(r))
  rect.setAttribute('ry', String(r))
  wrap.setAttribute('clip-path', `url(#${CORNER_CLIP_ID})`)
  commitDoc(doc)
}

function applyRootTransform() {
  const doc = parseLive()
  const wrap = doc.querySelector(`g[data-editor-type="${WRAPPER}"]`) as SVGGElement | null
  if (!wrap) return

  // Rotate around viewBox center
  const svg = doc.querySelector('svg')!
  const vb = (svg.getAttribute('viewBox') || '0 0 24 24').trim().split(/[\s,]+/).map(Number)
  const cx = (vb[0] || 0) + (vb[2] || 24) / 2
  const cy = (vb[1] || 0) + (vb[3] || 24) / 2

  const parts: string[] = []
  if (insp.angle) parts.push(`rotate(${insp.angle} ${cx} ${cy})`)
  const sx = insp.flipX ? -1 : 1
  const sy = insp.flipY ? -1 : 1
  if (sx !== 1 || sy !== 1) {
    parts.push(`translate(${cx} ${cy}) scale(${sx} ${sy}) translate(${-cx} ${-cy})`)
  }
  if (parts.length) wrap.setAttribute('transform', parts.join(' '))
  else wrap.removeAttribute('transform')
  commitDoc(doc)
}

function rotateBy(delta: number) {
  insp.angle = (insp.angle + delta + 360) % 360
  applyRootTransform()
}

function flip(axis: 'x' | 'y') {
  if (axis === 'x') insp.flipX = !insp.flipX
  else insp.flipY = !insp.flipY
  applyRootTransform()
}

function applySize() {
  const doc = parseLive()
  const svg = doc.querySelector('svg')
  if (!svg) return
  let w = Math.max(16, Math.round(insp.w || 24))
  let h = Math.max(16, Math.round(insp.h || 24))
  if (insp.lockRatio) {
    const ratio = insp.baseH / Math.max(insp.baseW, 1)
    h = Math.max(16, Math.round(w * ratio))
    insp.h = h
  }
  insp.w = w
  insp.scalePct = Math.round((w / Math.max(insp.baseW, 1)) * 100)
  // Keep viewBox; width/height describe export size intent via data attrs
  svg.setAttribute('data-export-width', String(w))
  svg.setAttribute('data-export-height', String(h))
  commitDoc(doc)
}

function applyPresetSize(side: number) {
  insp.lockRatio = true
  insp.w = side
  insp.h = Math.max(16, Math.round(side * (insp.baseH / Math.max(insp.baseW, 1))))
  applySize()
}

function applyScalePct() {
  const w = Math.max(16, Math.round(insp.baseW * (insp.scalePct / 100)))
  insp.w = w
  if (insp.lockRatio) {
    insp.h = Math.max(16, Math.round(insp.baseH * (insp.scalePct / 100)))
  }
  applySize()
}

function toggleVisible(id: string) {
  const doc = parseLive()
  if (id === SVG_ROOT_ID) {
    const wrap = doc.querySelector(`g[data-editor-type="${WRAPPER}"]`) || doc.querySelector('svg')
    if (!wrap) return
    if (wrap.getAttribute('display') === 'none') wrap.removeAttribute('display')
    else wrap.setAttribute('display', 'none')
    commitDoc(doc)
    return
  }
  const el = doc.querySelector(`[data-editor-id="${CSS.escape(id)}"]`)
  if (!el) return
  if (el.getAttribute('display') === 'none') el.removeAttribute('display')
  else el.setAttribute('display', 'none')
  commitDoc(doc)
}

function removeLayer(id: string) {
  if (id === SVG_ROOT_ID) return
  const doc = parseLive()
  const el = doc.querySelector(`[data-editor-id="${CSS.escape(id)}"]`)
  if (!el) return
  el.parentNode?.removeChild(el)
  const wasSelected = selectedId.value === id
  commitDoc(doc)
  if (wasSelected) selectLayer(SVG_ROOT_ID)
}

function bumpZoom(d: number) {
  zoom.value = Math.min(3, Math.max(0.25, Math.round((zoom.value + d) * 100) / 100))
}
function onWheel(e: WheelEvent) {
  bumpZoom(e.deltaY > 0 ? -0.05 : 0.05)
}

function exportSvg(): string {
  if (!svgCode.value) return ''
  try {
    const doc = parseLive()
    const svg = doc.querySelector('svg')
    if (!svg) return svgCode.value
    // Clean editor-only attrs for export
    svg.querySelectorAll('[data-editor-selected]').forEach((el) => el.removeAttribute('data-editor-selected'))
    const w = svg.getAttribute('data-export-width') || String(Math.round(insp.w))
    const h = svg.getAttribute('data-export-height') || String(Math.round(insp.h))
    svg.setAttribute('width', w)
    svg.setAttribute('height', h)
    svg.removeAttribute('data-export-width')
    svg.removeAttribute('data-export-height')
    // Keep data-editor-id out of clean export? OpenSVG keeps structure; strip ids for cleaner output
    svg.querySelectorAll('[data-editor-id]').forEach((el) => el.removeAttribute('data-editor-id'))
    const wrap = svg.querySelector(`g[data-editor-type="${WRAPPER}"]`)
    if (wrap) {
      wrap.removeAttribute('data-editor-type')
      wrap.removeAttribute('data-editor-id')
    }
    return new XMLSerializer().serializeToString(svg)
  } catch {
    return svgCode.value
  }
}

function svgToJsx(svg: string, ts = false): string {
  const attrs = svg
    .replace(/\sclass=/g, ' className=')
    .replace(/\sstroke-width=/g, ' strokeWidth=')
    .replace(/\sstroke-linecap=/g, ' strokeLinecap=')
    .replace(/\sstroke-linejoin=/g, ' strokeLinejoin=')
    .replace(/\sfill-rule=/g, ' fillRule=')
    .replace(/\sclip-rule=/g, ' clipRule=')
  const prop = ts ? ': React.SVGProps<SVGSVGElement>' : ''
  const imp = ts ? `import type React from 'react'\n\n` : ''
  return `${imp}export default function Icon(props${prop}) {\n  return (\n    ${attrs.replace('<svg', '<svg {...props}')}\n  )\n}\n`
}

function formatOutput(id: typeof codeTab.value): string {
  const svg = exportSvg()
  if (!svg) return ''
  switch (id) {
    case 'jsx':
      return svgToJsx(svg, false)
    case 'tsx':
      return svgToJsx(svg, true)
    case 'html':
      return svg
    case 'css':
      return `background-image: url("data:image/svg+xml,${encodeURIComponent(svg)}");`
    case 'datauri':
      return `data:image/svg+xml,${encodeURIComponent(svg)}`
    default:
      return svg
  }
}

async function copyFormat(id: typeof codeTab.value) {
  const text = formatOutput(id)
  if (!text) return
  await navigator.clipboard.writeText(text)
  showToast(`${id.toUpperCase()} copied`)
}

function downloadFormat(id: typeof codeTab.value) {
  const text = formatOutput(id)
  if (!text) return
  const ext =
    id === 'jsx' ? 'jsx' : id === 'tsx' ? 'tsx' : id === 'css' ? 'css' : id === 'html' ? 'html' : 'svg'
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }))
  a.download = `${fileName.value.replace(/\.svg$/i, '')}.${ext}`
  a.click()
}

function canvasSupportsMime(mime: string): boolean {
  try {
    const c = document.createElement('canvas')
    c.width = 1
    c.height = 1
    return c.toDataURL(mime).startsWith(`data:${mime}`)
  } catch {
    return false
  }
}

function downloadRaster() {
  const svg = exportSvg()
  if (!svg) return
  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const img = new Image()
  img.onload = () => {
    const scale = rasterScale.value
    const c = document.createElement('canvas')
    c.width = Math.max(1, Math.round(insp.w * scale))
    c.height = Math.max(1, Math.round(insp.h * scale))
    const ctx = c.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, c.width, c.height)
    ctx.drawImage(img, 0, 0, c.width, c.height)

    let ext = rasterFmt.value
    let mime = ext === 'webp' ? 'image/webp' : 'image/png'
    if (ext === 'webp' && !canvasSupportsMime('image/webp')) {
      ext = 'png'
      mime = 'image/png'
      showToast('WEBP not supported — downloaded as PNG')
    }

    const a = document.createElement('a')
    a.href = c.toDataURL(mime)
    a.download = `${fileName.value.replace(/\.svg$/i, '')}-${scale}x.${ext}`
    a.click()
    URL.revokeObjectURL(url)
  }
  img.onerror = () => URL.revokeObjectURL(url)
  img.src = url
}

async function onUpload(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  if (file.size > 2 * 1024 * 1024) {
    error.value = 'File must be under 2 MB'
    return
  }
  await loadSvgString(await file.text(), file.name || 'upload.svg')
}

async function onPaste() {
  try {
    const text = await navigator.clipboard.readText()
    if (!/<svg[\s>]/i.test(text) && !/<path[\s>]/i.test(text)) {
      showToast('Clipboard has no SVG')
      return
    }
    await loadSvgString(text, 'pasted.svg')
  } catch {
    showToast('Clipboard permission denied')
  }
}

function resetAll() {
  if (originalSvg.value) void loadSvgString(originalSvg.value, fileName.value)
}

function onKeydown(e: KeyboardEvent) {
  const tag = (e.target as HTMLElement | null)?.tagName?.toLowerCase()
  if (tag === 'input' || tag === 'textarea' || tag === 'select') return
  if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId.value && selectedId.value !== SVG_ROOT_ID) {
    e.preventDefault()
    removeLayer(selectedId.value)
    return
  }
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
    e.preventDefault()
    if (e.shiftKey) redo()
    else undo()
  }
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
    e.preventDefault()
    redo()
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
  emit('ready')
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  window.removeEventListener('pointermove', onInteractionMove)
  window.removeEventListener('pointerup', onInteractionEnd)
  window.removeEventListener('pointercancel', onInteractionEnd)
  interaction.value = null
  if (toastTimer) clearTimeout(toastTimer)
})

defineExpose({
  loadSvgString,
  exportSvg,
})
</script>

<style scoped>
.studio {
  --studio-accent: var(--sf-accent);
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  border: 1px solid var(--sf-border);
  border-radius: 12px;
  overflow: hidden;
  background: #fff;
}

.topbar,
.bottombar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem 1rem;
  padding: 0.65rem 0.85rem;
  border-bottom: 1px solid var(--sf-border);
  background: #fff;
}

.bottombar {
  border-bottom: none;
  border-top: 1px solid var(--sf-border);
  justify-content: space-between;
}

.top-left,
.top-right,
.zoom-group,
.bg-group,
.format-row,
.raster-row,
.rotate-btns,
.color-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem;
}

.top-meta {
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.75rem;
  color: var(--sf-muted);
  font-size: 0.85rem;
}

.top-meta strong {
  color: var(--sf-text);
}

.tb-btn,
.icon-btn,
.mini,
.none-btn {
  appearance: none;
  border: 1px solid var(--sf-border);
  background: #fff;
  color: var(--sf-text);
  border-radius: 8px;
  padding: 0.4rem 0.7rem;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
}

.tb-btn.solid {
  background: var(--studio-accent);
  border-color: var(--studio-accent);
  color: #fff;
}

.tb-btn.danger {
  color: #dc2626;
  border-color: #fecaca;
  background: #fef2f2;
}

.tb-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.tb-btn {
  position: relative;
  overflow: hidden;
}

.tb-btn input[type='file'] {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
}

.tb-btn.on {
  border-color: var(--studio-accent);
  color: var(--studio-accent);
}

.body {
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr) 280px;
  min-height: 520px;
  flex: 1;
  background: #f8fafc;
}

@media (max-width: 960px) {
  .body {
    grid-template-columns: 1fr;
  }
}

.panel {
  background: #fafbfc;
  overflow: auto;
}

.layers-panel {
  border-right: 1px solid var(--sf-border);
  min-width: 200px;
  min-height: 0;
}

.inspector-panel {
  border-left: 1px solid var(--sf-border);
  min-width: 240px;
  min-height: 0;
}

.layer-tree {
  list-style: none;
  margin: 0;
  padding: 0.35rem 0;
  display: block;
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 0.9rem;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--sf-muted);
  border-bottom: 1px solid var(--sf-border);
  position: sticky;
  top: 0;
  background: #fafbfc;
  z-index: 1;
}

.badge {
  background: #e2e8f0;
  border-radius: 999px;
  padding: 0.1rem 0.45rem;
  font-size: 0.7rem;
}

.empty {
  padding: 1rem;
  color: var(--sf-muted);
  font-size: 0.88rem;
}

.artboard {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.artboard-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.55rem 0.85rem;
  background: #fff;
  border-bottom: 1px solid var(--sf-border);
}

.bar-label {
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--sf-muted);
  margin-right: 0.25rem;
}

.bg-swatch {
  width: 22px;
  height: 22px;
  border-radius: 6px;
  border: 2px solid transparent;
  cursor: pointer;
  padding: 0;
}

.bg-swatch.active {
  border-color: var(--studio-accent);
}

.bg-swatch.checker {
  background-color: #fff;
  background-image:
    linear-gradient(45deg, #cbd5e1 25%, transparent 25%),
    linear-gradient(-45deg, #cbd5e1 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #cbd5e1 75%),
    linear-gradient(-45deg, transparent 75%, #cbd5e1 75%);
  background-size: 8px 8px;
  background-position: 0 0, 0 4px, 4px -4px, -4px 0;
}

.zoom-label {
  min-width: 3.2rem;
  text-align: center;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--sf-muted);
}

.icon-btn {
  width: 32px;
  height: 32px;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.icon-btn.lock.on {
  border-color: var(--studio-accent);
  color: var(--studio-accent);
}

.viewport {
  position: relative;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: auto;
  min-height: 560px;
  padding: 1.5rem;
}

.viewport.bg-checker {
  background-color: #f1f5f9;
}

.viewport.bg-white {
  background: #e2e8f0;
}

.viewport.bg-dark {
  background: #020617;
}

.stage {
  position: relative;
  border-radius: 8px;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.12);
  flex-shrink: 0;
  overflow: hidden;
}

.stage-checker {
  background-color: #fff;
  background-image:
    linear-gradient(45deg, #e2e8f0 25%, transparent 25%),
    linear-gradient(-45deg, #e2e8f0 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #e2e8f0 75%),
    linear-gradient(-45deg, transparent 75%, #e2e8f0 75%);
  background-size: 16px 16px;
  background-position: 0 0, 0 8px, 8px -8px, -8px 0;
}

.stage-white {
  background: #fff;
}

.stage-dark {
  background: #0f172a;
}

.svg-host {
  width: 100%;
  height: 100%;
  padding: 40px;
  box-sizing: border-box;
}

.svg-host :deep(svg) {
  width: 100%;
  height: 100%;
  display: block;
  overflow: visible;
}

.svg-host :deep(path),
.svg-host :deep(rect),
.svg-host :deep(circle),
.svg-host :deep(ellipse),
.svg-host :deep(polygon),
.svg-host :deep(polyline),
.svg-host :deep(line),
.svg-host :deep(g) {
  cursor: pointer;
}

.svg-host.root-selected :deep(svg) {
  overflow: visible;
}

.shape-outline-box {
  position: absolute;
  pointer-events: none;
  z-index: 3;
  box-sizing: border-box;
  border: 1.5px dashed #6366f1;
  border-radius: 2px;
}

.shape-outline-box.interacting {
  border-style: solid;
}

.resize-handle {
  position: absolute;
  width: 9px;
  height: 9px;
  padding: 0;
  border: 1.5px solid #6366f1;
  border-radius: 1px;
  background: #fff;
  box-sizing: border-box;
  pointer-events: auto;
  appearance: none;
}

.resize-handle.nw {
  left: -5px;
  top: -5px;
  cursor: nwse-resize;
}
.resize-handle.n {
  left: 50%;
  top: -5px;
  margin-left: -4.5px;
  cursor: ns-resize;
}
.resize-handle.ne {
  right: -5px;
  top: -5px;
  cursor: nesw-resize;
}
.resize-handle.e {
  right: -5px;
  top: 50%;
  margin-top: -4.5px;
  cursor: ew-resize;
}
.resize-handle.se {
  right: -5px;
  bottom: -5px;
  cursor: nwse-resize;
}
.resize-handle.s {
  left: 50%;
  bottom: -5px;
  margin-left: -4.5px;
  cursor: ns-resize;
}
.resize-handle.sw {
  left: -5px;
  bottom: -5px;
  cursor: nesw-resize;
}
.resize-handle.w {
  left: -5px;
  top: 50%;
  margin-top: -4.5px;
  cursor: ew-resize;
}

.svg-host.has-selection:not(.interacting) :deep([data-editor-selected='1']) {
  cursor: move;
}

.svg-host.interacting {
  user-select: none;
  touch-action: none;
}

.size-presets {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin-bottom: 0.65rem;
}

.preset {
  appearance: none;
  border: 1px solid var(--sf-border);
  background: #fff;
  border-radius: 6px;
  padding: 0.25rem 0.45rem;
  font-size: 0.75rem;
  font-weight: 650;
  cursor: pointer;
  color: var(--sf-muted);
}

.preset.on,
.preset:hover {
  border-color: var(--studio-accent);
  color: var(--studio-accent);
}

.stage-banner {
  position: absolute;
  left: 50%;
  bottom: 1rem;
  transform: translateX(-50%);
  margin: 0;
  padding: 0.45rem 0.9rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 650;
  letter-spacing: 0.02em;
  pointer-events: none;
  background: rgba(255, 255, 255, 0.92);
  color: var(--sf-muted);
  border: 1px solid var(--sf-border);
}

.stage-banner.tip {
  background: rgba(15, 23, 42, 0.82);
  color: #fff;
  border: none;
}

.stage-banner.error {
  background: #fef2f2;
  color: #dc2626;
  border-color: #fecaca;
}

.insp-section {
  padding: 0.85rem 0.9rem;
  border-bottom: 1px solid var(--sf-border);
}

.insp-section h3 {
  margin: 0 0 0.65rem;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--sf-muted);
}

.sel-hint {
  margin: 0 0 0.55rem;
  font-size: 0.78rem;
  color: var(--sf-muted);
  font-family: ui-monospace, monospace;
}

.wh-row {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 0.4rem;
  align-items: end;
  margin-bottom: 0.55rem;
}

.wh-row label,
.field,
.color-block {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  font-size: 0.78rem;
  color: var(--sf-muted);
}

.wh-row input,
.slider-row .num {
  width: 100%;
  padding: 0.4rem 0.45rem;
  border: 1px solid var(--sf-border);
  border-radius: 8px;
  background: #fff;
  color: var(--sf-text);
}

input[type='range'] {
  width: 100%;
  accent-color: var(--studio-accent);
}

.color-block {
  margin-bottom: 0.65rem;
}

input[type='color'] {
  width: 36px;
  height: 28px;
  padding: 0;
  border: 1px solid var(--sf-border);
  border-radius: 8px;
  background: transparent;
}

.none-btn {
  width: 32px;
  height: 28px;
  padding: 0;
}

.none-btn.on {
  border-color: var(--studio-accent);
  color: var(--studio-accent);
}

.slider-row {
  display: grid;
  grid-template-columns: 1fr 64px;
  gap: 0.5rem;
  align-items: center;
}

.fmt-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  border: 1px solid var(--sf-border);
  border-radius: 8px;
  padding: 0.2rem 0.35rem 0.2rem 0.55rem;
  font-size: 0.8rem;
  font-weight: 700;
  background: #fff;
}

.mini {
  padding: 0.2rem 0.4rem;
  font-size: 0.72rem;
}

.raster-row select {
  padding: 0.4rem 0.5rem;
  border-radius: 8px;
  border: 1px solid var(--sf-border);
}

.code-drawer {
  border-top: 1px solid var(--sf-border);
  background: #0f172a;
  color: #e2e8f0;
  max-height: 220px;
  display: flex;
  flex-direction: column;
}

.code-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid #1e293b;
}

.code-tabs .tab {
  appearance: none;
  border: none;
  background: transparent;
  color: #94a3b8;
  padding: 0.3rem 0.55rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.8rem;
}

.code-tabs .tab.active {
  background: #1e293b;
  color: #fff;
}

.code-drawer pre {
  margin: 0;
  padding: 0.75rem 1rem;
  overflow: auto;
  font-size: 0.78rem;
  white-space: pre-wrap;
  word-break: break-all;
}

.error {
  color: #dc2626;
  font-size: 0.88rem;
}

.toast {
  position: fixed;
  bottom: 1.25rem;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(15, 23, 42, 0.9);
  color: #fff;
  padding: 0.55rem 0.95rem;
  border-radius: 999px;
  font-size: 0.85rem;
  font-weight: 600;
  z-index: 60;
}
</style>
