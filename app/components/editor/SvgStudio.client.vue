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
            class="float-toolbar"
            role="toolbar"
            aria-label="Drawing tools"
            @click.stop
            @pointerdown.stop
          >
            <button
              type="button"
              class="float-tool"
              :class="{ active: activeTool === 'select' }"
              :disabled="!svgCode"
              title="Select"
              @click="setActiveTool('select')"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4l7.5 16 1.8-6.7L20 11.5 4 4z" fill="currentColor"/></svg>
            </button>
            <span class="float-divider" aria-hidden="true" />
            <button
              type="button"
              class="float-tool"
              :class="{ active: activeTool === 'rect' }"
              :disabled="!svgCode"
              title="Rectangle"
              @click="setActiveTool('rect')"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="6" width="14" height="12" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.75"/></svg>
            </button>
            <button
              type="button"
              class="float-tool"
              :class="{ active: activeTool === 'circle' }"
              :disabled="!svgCode"
              title="Circle"
              @click="setActiveTool('circle')"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="7" fill="none" stroke="currentColor" stroke-width="1.75"/></svg>
            </button>
            <button
              type="button"
              class="float-tool"
              :class="{ active: activeTool === 'line' }"
              :disabled="!svgCode"
              title="Line"
              @click="setActiveTool('line')"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 19L19 5" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/></svg>
            </button>
            <span class="float-divider" aria-hidden="true" />
            <button
              type="button"
              class="float-tool"
              :class="{ active: activeTool === 'polyline' }"
              :disabled="!svgCode"
              title="Polyline"
              @click="setActiveTool('polyline')"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 16l5-8 5 5 6-9" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
            <button
              type="button"
              class="float-tool"
              :class="{ active: activeTool === 'pencil' }"
              :disabled="!svgCode"
              title="Pencil"
              @click="setActiveTool('pencil')"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 5.5l4 4L8 20H4v-4L14.5 5.5z" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linejoin="round"/><path d="M12.5 7.5l4 4" fill="none" stroke="currentColor" stroke-width="1.75"/></svg>
            </button>
            <span class="float-divider" aria-hidden="true" />
            <button
              type="button"
              class="float-tool"
              :class="{ active: activeTool === 'text' }"
              :disabled="!svgCode"
              title="Text"
              @click="setActiveTool('text')"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5h14M12 5v14M8 19h8" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
          </div>

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
                interacting: !!interaction || !!drawSession || !!textEdit,
                'draw-mode': activeTool !== 'select' && activeTool !== 'text',
                'text-mode': activeTool === 'text',
              }"
              v-html="annotatedSvg"
              @pointerdown.capture="onSvgPointerDown"
            />
            <div
              v-if="shapeOutline && activeTool === 'select' && !textEdit"
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
            <div
              v-if="textEdit"
              class="text-edit-overlay"
              :style="{
                left: `${textEdit.left}px`,
                top: `${textEdit.top}px`,
                minWidth: `${textEdit.minWidth}px`,
                fontSize: `${textEdit.fontSizePx}px`,
                color: textEdit.color,
              }"
              @pointerdown.stop
              @click.stop
            >
              <input
                ref="textEditInputRef"
                v-model="textEdit.draft"
                type="text"
                class="text-edit-input"
                :placeholder="'Type here…'"
                @input="onTextEditInput"
                @keydown="onTextEditKeydown"
                @blur="finishTextEdit(true)"
              />
            </div>
          </div>
          <p v-if="error" class="stage-banner error">{{ error }}</p>
          <p v-else-if="!svgCode" class="stage-banner">Upload or paste an SVG to start</p>
          <p v-else class="stage-banner tip">{{ toolTip }}</p>
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

          <div v-if="selectedIsText" class="insp-section">
            <h3>Text</h3>
            <label class="field">
              Content
              <input
                v-model="insp.text"
                type="text"
                class="text-field"
                placeholder="Enter text"
                @change="applyTextContent"
              />
            </label>
            <label class="field">
              Font size {{ insp.fontSize }}
              <input
                v-model.number="insp.fontSize"
                type="range"
                min="1"
                :max="fontSizeMax"
                step="0.5"
                @input="applyFontSize"
              />
            </label>
          </div>

          <div class="insp-section">
            <h3>Colors</h3>
            <p v-if="selectedId && selectedId !== svgRootId" class="sel-hint">Editing: {{ selectedId }}</p>
            <p v-else class="sel-hint">Editing: SVG Root (all shapes)</p>
            <div class="color-block">
              <span>{{ selectedIsText ? 'Color' : 'Fill' }}</span>
              <div class="color-row">
                <input v-model="insp.fill" type="color" :disabled="insp.fillNone" @input="applyColors" />
                <button
                  v-if="!selectedIsText"
                  type="button"
                  class="none-btn"
                  :class="{ on: insp.fillNone }"
                  @click="toggleFillNone"
                >
                  Ø
                </button>
              </div>
            </div>
            <div v-if="!selectedIsText" class="color-block">
              <span>Stroke</span>
              <div class="color-row">
                <input v-model="insp.stroke" type="color" :disabled="insp.strokeNone" @input="applyColors" />
                <button type="button" class="none-btn" :class="{ on: insp.strokeNone }" @click="toggleStrokeNone">
                  Ø
                </button>
              </div>
            </div>
            <label v-if="!selectedIsText && !insp.strokeNone" class="field">
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
import {
  clientToElementLocal,
  createDrawElement,
  createTextElement,
  isDrawTool,
  pathHasEnoughPoints,
  pointsToPathD,
  shapeHasSize,
  strokeOnlyTool,
  thinPoints,
  updateCircleGeometry,
  updateLineGeometry,
  updateRectGeometry,
  type DrawStyle,
  type EditorTool,
} from './svgDraw'

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
  text: '',
  fontSize: 4,
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

type DrawSession = {
  tool: Exclude<EditorTool, 'select'>
  pointerId: number
  id: string
  startLocal: SvgPoint
  points: SvgPoint[]
  moved: boolean
  /** Polyline stays open across clicks until finish/cancel. */
  open: boolean
  frozenMarkup: string
}

const activeTool = ref<EditorTool>('select')
const drawSession = shallowRef<DrawSession | null>(null)

type TextEditSession = {
  id: string
  isNew: boolean
  draft: string
  left: number
  top: number
  minWidth: number
  fontSizePx: number
  color: string
  frozenMarkup: string
}

const textEdit = ref<TextEditSession | null>(null)
const textEditInputRef = ref<HTMLInputElement | null>(null)
let textEditFinishing = false

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
const fontSizeMax = computed(() => Math.max(8, Math.round(Math.min(insp.baseW, insp.baseH))))
const selectedIsText = computed(() => {
  if (!selectedId.value || selectedId.value === SVG_ROOT_ID) return false
  return findLayer(selectedId.value)?.type === 'text'
})
const radiusHint = computed(() => {
  if (selectedId.value && selectedId.value !== SVG_ROOT_ID) {
    const node = findLayer(selectedId.value)
    if (node?.type === 'rect') return 'Editing selected rect corners (rx / ry)'
  }
  return 'Clipping whole icon with rounded corners'
})

const toolTip = computed(() => {
  switch (activeTool.value) {
    case 'rect':
      return 'Drag to draw rectangle · Shift locks square · Alt+click selects · Esc select'
    case 'circle':
      return 'Drag to draw circle · Shift from center · Alt+click selects · Esc select'
    case 'line':
      return 'Drag to draw line · Shift locks axis · Alt+click selects · Esc select'
    case 'polyline':
      return 'Click to add points · Double-click or Enter to finish · Alt+click selects · Esc cancel'
    case 'pencil':
      return 'Drag to freehand draw · Alt+click selects · Esc select'
    case 'text':
      return 'Click to place text · Enter commits · Esc cancels'
    default:
      return 'Drag to move · double-click text to edit · Shift locks aspect'
  }
})

/** Annotated markup for display (root dashed box; shape outline is a separate HTML overlay). */
const annotatedSvg = computed(() => {
  // Freeze markup while dragging/drawing so v-html does not wipe live DOM mutations.
  if (interaction.value?.frozenMarkup) return interaction.value.frozenMarkup
  if (drawSession.value?.frozenMarkup) return drawSession.value.frozenMarkup
  if (textEdit.value?.frozenMarkup) return textEdit.value.frozenMarkup

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
    const textPreview = tag === 'text' ? (child.textContent || '').trim() : ''
    out.push({
      id,
      label: textPreview ? `TEXT “${textPreview.slice(0, 18)}${textPreview.length > 18 ? '…' : ''}”` : tag.toUpperCase(),
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

function nextEditorId(tag: string): string {
  const host = svgHostRef.value
  const live = host?.querySelector('svg')
  let max = 0
  live?.querySelectorAll('[data-editor-id]').forEach((el) => {
    const id = el.getAttribute('data-editor-id') || ''
    const m = id.match(/-(\d+)$/)
    if (m) max = Math.max(max, parseInt(m[1], 10))
  })
  return `${tag}-${max + 1}`
}

function currentDrawStyle(): DrawStyle {
  return {
    fill: insp.fill,
    fillNone: insp.fillNone,
    stroke: insp.stroke,
    strokeNone: insp.strokeNone,
    strokeWidth: insp.strokeWidth,
  }
}

function liveWrapper(): SVGGElement | null {
  const host = svgHostRef.value
  const svg = host?.querySelector('svg')
  if (!svg) return null
  return (svg.querySelector(`g[data-editor-type="${WRAPPER}"]`) as SVGGElement | null) || (svg as unknown as SVGGElement)
}

function setActiveTool(tool: EditorTool) {
  if (!svgCode.value && tool !== 'select') return
  if (textEdit.value) finishTextEdit(true)
  if (drawSession.value) cancelDrawSession(false)
  activeTool.value = tool
  if (tool !== 'select') {
    // Clear selection so v-html is stable before the first draw stroke
    // (changing selectedId mid-gesture would replace the live SVG DOM).
    selectedId.value = ''
    shapeOutline.value = null
  } else {
    void refreshShapeOutline()
  }
}

function bindDrawWindowListeners() {
  window.addEventListener('pointermove', onDrawPointerMove)
  window.addEventListener('pointerup', onDrawPointerUp)
  window.addEventListener('pointercancel', onDrawPointerUp)
}

function unbindDrawWindowListeners() {
  window.removeEventListener('pointermove', onDrawPointerMove)
  window.removeEventListener('pointerup', onDrawPointerUp)
  window.removeEventListener('pointercancel', onDrawPointerUp)
}

function cancelDrawSession(commitNothing = true) {
  const sess = drawSession.value
  unbindDrawWindowListeners()
  if (sess) {
    const el = liveElement(sess.id)
    el?.parentNode?.removeChild(el)
  }
  drawSession.value = null
  if (commitNothing) {
    // live node removed without commit — refresh from svgCode
    // frozenMarkup cleared by nulling session; force re-render
  }
}

async function placeTextAtPointer(e: PointerEvent) {
  const host = svgHostRef.value
  if (!host) return

  e.preventDefault()
  e.stopPropagation()

  if (textEdit.value) {
    finishTextEdit(true)
    await nextTick()
  }

  if (selectedId.value) {
    selectedId.value = ''
    shapeOutline.value = null
    await nextTick()
  }

  const wrap = liveWrapper()
  const svg = host.querySelector('svg')
  if (!wrap || !svg) return

  const pt = clientToElementLocal(wrap, e.clientX, e.clientY)
  const vb = readViewBox(svg)
  const fontSize = Math.max(2, Math.round((Math.min(vb.w, vb.h) / 5) * 100) / 100)
  const id = nextEditorId('text')
  const style = currentDrawStyle()
  const el = createTextElement(document, pt, style, id, fontSize, 'Text')
  wrap.appendChild(el)

  // Freeze live DOM (with new text) so overlay typing does not wipe the node.
  const frozen = (() => {
    const live = host.querySelector('svg')
    if (!live) return annotatedSvg.value
    const clone = live.cloneNode(true) as Element
    clone.querySelectorAll('[data-editor-overlay]').forEach((n) => n.parentNode?.removeChild(n))
    clone.querySelectorAll('[data-editor-selected]').forEach((n) => n.removeAttribute('data-editor-selected'))
    return new XMLSerializer().serializeToString(clone)
  })()

  textEdit.value = {
    id,
    isNew: true,
    draft: 'Text',
    left: 0,
    top: 0,
    minWidth: 48,
    fontSizePx: 16,
    color: el.getAttribute('fill') || '#1a2332',
    frozenMarkup: frozen,
  }

  await nextTick()
  positionTextEditOverlay(id)
  await nextTick()
  const input = textEditInputRef.value
  if (input) {
    input.focus()
    input.select()
  }
}

function positionTextEditOverlay(id: string) {
  const sess = textEdit.value
  const el = liveElement(id)
  const stage = stageRef.value
  if (!sess || !el || !stage) return

  const rect = elementScreenRect(el)
  const stageRect = stage.getBoundingClientRect()
  const fontSizeAttr = parseFloat(el.getAttribute('font-size') || String(insp.fontSize) || '4')
  const ctm = el.getScreenCTM()
  const scale = ctm ? Math.hypot(ctm.a, ctm.b) : 1

  sess.left = rect.left - stageRect.left
  sess.top = rect.top - stageRect.top
  sess.minWidth = Math.max(48, rect.width + 12)
  sess.fontSizePx = Math.max(12, fontSizeAttr * scale)
  sess.color = el.getAttribute('fill') || '#1a2332'
}

function onTextEditInput() {
  const sess = textEdit.value
  if (!sess) return
  const el = liveElement(sess.id)
  if (el) el.textContent = sess.draft.length ? sess.draft : ' '
  positionTextEditOverlay(sess.id)
}

function onTextEditKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') {
    e.preventDefault()
    finishTextEdit(true)
    return
  }
  if (e.key === 'Escape') {
    e.preventDefault()
    finishTextEdit(false)
  }
}

function finishTextEdit(save: boolean) {
  const sess = textEdit.value
  if (!sess || textEditFinishing) return
  textEditFinishing = true

  try {
    const draft = sess.draft.trim()
    const el = liveElement(sess.id)

    if (!save) {
      // Drop freeze → v-html reverts to last committed svgCode
      textEdit.value = null
      if (!sess.isNew) {
        selectedId.value = sess.id
        void refreshShapeOutline()
      }
      return
    }

    if (!draft) {
      if (!sess.isNew && el) {
        el.parentNode?.removeChild(el)
        commitLiveHost(true)
        textEdit.value = null
        selectedId.value = ''
        return
      }
      textEdit.value = null
      return
    }

    if (el) el.textContent = draft
    // Commit while freeze is still active so v-html does not wipe the live node first.
    commitLiveHost(true)
    textEdit.value = null
    selectedId.value = sess.id
    syncInspFromSelection()
    void refreshShapeOutline()
  } finally {
    textEditFinishing = false
  }
}

async function openTextEditor(id: string, isNew: boolean) {
  const el = liveElement(id)
  if (!el || el.tagName.toLowerCase() !== 'text') return

  shapeOutline.value = null
  const frozen = annotatedSvg.value
  textEdit.value = {
    id,
    isNew,
    draft: (el.textContent || '').trim() || 'Text',
    left: 0,
    top: 0,
    minWidth: 48,
    fontSizePx: 16,
    color: el.getAttribute('fill') || '#1a2332',
    frozenMarkup: frozen,
  }
  await nextTick()
  positionTextEditOverlay(id)
  await nextTick()
  const input = textEditInputRef.value
  if (input) {
    input.focus()
    input.select()
  }
}

async function beginDragDraw(tool: Exclude<EditorTool, 'select' | 'polyline' | 'text'>, e: PointerEvent) {
  const host = svgHostRef.value
  if (!host) return

  e.preventDefault()
  e.stopPropagation()

  // Drop selection first, then resolve wrap from the post-update live DOM.
  // Resolving wrap before nextTick leaves a detached node after v-html refresh.
  if (selectedId.value) {
    selectedId.value = ''
    shapeOutline.value = null
    await nextTick()
  }

  const wrap = liveWrapper()
  if (!wrap) return

  const start = clientToElementLocal(wrap, e.clientX, e.clientY)
  const tag = tool === 'pencil' ? 'path' : tool
  const id = nextEditorId(tag)
  const style = currentDrawStyle()
  // Ensure stroke-only tools always paint a visible stroke
  if (strokeOnlyTool(tool) && style.strokeNone) {
    style.strokeNone = false
  }
  if (!strokeOnlyTool(tool) && style.fillNone && style.strokeNone) {
    style.fillNone = false
  }

  const el = createDrawElement(document, tool, start, style, id)
  wrap.appendChild(el)

  drawSession.value = {
    tool,
    pointerId: e.pointerId,
    id,
    startLocal: start,
    points: [{ ...start }],
    moved: false,
    open: false,
    frozenMarkup: annotatedSvg.value,
  }

  bindDrawWindowListeners()
  try {
    host.setPointerCapture(e.pointerId)
  } catch {
    /* ignore */
  }
}

async function beginOrContinuePolyline(e: PointerEvent) {
  const host = svgHostRef.value
  if (!host) return

  e.preventDefault()
  e.stopPropagation()

  const existing = drawSession.value

  if (existing && existing.tool === 'polyline' && existing.open) {
    const wrap = liveWrapper()
    if (!wrap) return
    const pt = clientToElementLocal(wrap, e.clientX, e.clientY)
    // Double-click finish
    if (e.detail >= 2) {
      finishPolyline(true)
      return
    }
    existing.points.push(pt)
    const el = liveElement(existing.id)
    if (el) el.setAttribute('d', pointsToPathD(existing.points))
    return
  }

  if (selectedId.value) {
    selectedId.value = ''
    shapeOutline.value = null
    await nextTick()
  }

  const wrap = liveWrapper()
  if (!wrap) return
  const pt = clientToElementLocal(wrap, e.clientX, e.clientY)

  const id = nextEditorId('path')
  const style = currentDrawStyle()
  if (style.strokeNone) style.strokeNone = false

  const el = createDrawElement(document, 'polyline', pt, style, id)
  wrap.appendChild(el)

  drawSession.value = {
    tool: 'polyline',
    pointerId: e.pointerId,
    id,
    startLocal: pt,
    points: [{ ...pt }],
    moved: false,
    open: true,
    frozenMarkup: annotatedSvg.value,
  }
}

function onDrawPointerMove(e: PointerEvent) {
  const sess = drawSession.value
  if (!sess || sess.open) return
  if (e.pointerId !== sess.pointerId) return

  const wrap = liveWrapper()
  const el = liveElement(sess.id)
  if (!wrap || !el) return

  const cur = clientToElementLocal(wrap, e.clientX, e.clientY)
  const keepAspect = e.shiftKey

  if (sess.tool === 'pencil') {
    const last = sess.points[sess.points.length - 1]
    if (!last || Math.hypot(cur.x - last.x, cur.y - last.y) >= 0.8) {
      sess.points.push(cur)
      sess.moved = true
      el.setAttribute('d', pointsToPathD(sess.points))
    }
    return
  }

  const dist = Math.hypot(cur.x - sess.startLocal.x, cur.y - sess.startLocal.y)
  if (!sess.moved && dist < 0.5) return
  sess.moved = true

  if (sess.tool === 'rect') updateRectGeometry(el, sess.startLocal, cur, keepAspect)
  else if (sess.tool === 'circle') updateCircleGeometry(el, sess.startLocal, cur, keepAspect)
  else if (sess.tool === 'line') updateLineGeometry(el, sess.startLocal, cur, keepAspect)
}

function onDrawPointerUp(e: PointerEvent) {
  const sess = drawSession.value
  if (!sess || sess.open) return
  if (e.pointerId !== sess.pointerId) return

  unbindDrawWindowListeners()
  try {
    if (svgHostRef.value?.hasPointerCapture(e.pointerId)) {
      svgHostRef.value.releasePointerCapture(e.pointerId)
    }
  } catch {
    /* ignore */
  }

  const el = liveElement(sess.id)
  let keep = false

  if (sess.tool === 'pencil') {
    const thinned = thinPoints(sess.points, 1.2)
    if (el && pathHasEnoughPoints(thinned, 2)) {
      el.setAttribute('d', pointsToPathD(thinned))
      keep = true
    }
  } else if (el && shapeHasSize(sess.tool, el)) {
    keep = true
  }

  if (!keep && el) {
    el.parentNode?.removeChild(el)
    drawSession.value = null
    return
  }

  const id = sess.id
  commitLiveHost(true)
  drawSession.value = null
  selectedId.value = id
  syncInspFromSelection()
  void refreshShapeOutline()
}

function finishPolyline(keep: boolean) {
  const sess = drawSession.value
  if (!sess || sess.tool !== 'polyline') return

  const el = liveElement(sess.id)
  if (!keep || !pathHasEnoughPoints(sess.points, 2)) {
    el?.parentNode?.removeChild(el)
    drawSession.value = null
    return
  }

  if (el) el.setAttribute('d', pointsToPathD(sess.points))
  const id = sess.id
  commitLiveHost(true)
  drawSession.value = null
  selectedId.value = id
  syncInspFromSelection()
  void refreshShapeOutline()
}

async function onSvgPointerDown(e: PointerEvent) {
  if (e.button !== 0) return
  if (interaction.value) return

  const host = svgHostRef.value
  if (!host || !svgCode.value) return

  const tool = activeTool.value

  if (isDrawTool(tool)) {
    // Draw tools paint over existing shapes (Figma/Illustrator-style).
    // Alt/Option+click still selects so users can jump out without the Select tool.
    const hitId = hitEditorId(e.target as Element | null, e.currentTarget)
    const stealToSelect =
      e.altKey &&
      !!hitId &&
      !(drawSession.value?.tool === 'polyline' && drawSession.value.open) &&
      !(drawSession.value && hitId === drawSession.value.id)

    if (stealToSelect && hitId) {
      setActiveTool('select')
      e.preventDefault()
      e.stopPropagation()
      selectLayer(hitId)
      await nextTick()
      await refreshShapeOutline()
      if (e.buttons === 0) return
      beginInteraction('move', hitId, e)
      return
    }

    if (tool === 'text') {
      await placeTextAtPointer(e)
      return
    }

    if (tool === 'polyline') {
      await beginOrContinuePolyline(e)
      return
    }

    // Start drag draw anywhere on the artboard (including over existing paths)
    if (drawSession.value) return
    await beginDragDraw(tool, e)
    return
  }

  // select mode
  if (drawSession.value || textEdit.value) return
  const id = hitEditorId(e.target as Element | null, e.currentTarget)
  if (!id) return

  e.preventDefault()
  e.stopPropagation()

  if (selectedId.value !== id) {
    selectLayer(id)
    await nextTick()
    await refreshShapeOutline()
  }

  // Double-click text → inline edit
  if (e.detail >= 2) {
    const node = findLayer(id)
    if (node?.type === 'text') {
      await openTextEditor(id, false)
      return
    }
  }

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
  if (interaction.value || drawSession.value) return
  if (activeTool.value !== 'select') return
  selectLayer(SVG_ROOT_ID)
}

function selectLayer(id: string) {
  if (textEdit.value) finishTextEdit(true)
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
    doc.querySelector('path, rect, circle, ellipse, polygon, polyline, line, text')

  if (el && el.tagName.toLowerCase() === 'text') {
    insp.text = (el.textContent || '').trim()
    const fs = parseFloat(el.getAttribute('font-size') || '')
    if (!Number.isNaN(fs) && fs > 0) insp.fontSize = fs
  } else {
    insp.text = ''
  }

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
    const isText = el.tagName.toLowerCase() === 'text'
    if (isText) {
      el.setAttribute('fill', insp.fillNone ? '#1a2332' : insp.fill)
      el.setAttribute('stroke', 'none')
      el.removeAttribute('stroke-width')
      return
    }
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

function applyTextContent() {
  if (!selectedIsText.value) return
  const doc = parseLive()
  const el = doc.querySelector(`[data-editor-id="${CSS.escape(selectedId.value)}"]`)
  if (!el || el.tagName.toLowerCase() !== 'text') return
  const next = insp.text.trim()
  if (!next) return
  el.textContent = next
  commitDoc(doc)
  void refreshShapeOutline()
}

function applyFontSize() {
  if (!selectedIsText.value) return
  const doc = parseLive()
  const el = doc.querySelector(`[data-editor-id="${CSS.escape(selectedId.value)}"]`)
  if (!el || el.tagName.toLowerCase() !== 'text') return
  const size = Math.max(0.5, Number(insp.fontSize) || 1)
  el.setAttribute('font-size', String(size))
  commitDoc(doc)
  void refreshShapeOutline()
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

  if (e.key === 'Escape') {
    if (textEdit.value) {
      e.preventDefault()
      finishTextEdit(false)
      return
    }
    if (drawSession.value?.tool === 'polyline' && drawSession.value.open) {
      e.preventDefault()
      finishPolyline(false)
      return
    }
    if (drawSession.value) {
      e.preventDefault()
      cancelDrawSession()
      return
    }
    if (activeTool.value !== 'select') {
      e.preventDefault()
      setActiveTool('select')
      return
    }
  }

  if (e.key === 'Enter' && drawSession.value?.tool === 'polyline' && drawSession.value.open) {
    e.preventDefault()
    finishPolyline(true)
    return
  }

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
  unbindDrawWindowListeners()
  interaction.value = null
  drawSession.value = null
  textEdit.value = null
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

.float-toolbar {
  position: absolute;
  top: 14px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 20;
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 6px 8px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  box-shadow:
    0 1px 2px rgba(15, 23, 42, 0.04),
    0 8px 24px rgba(15, 23, 42, 0.1);
  pointer-events: auto;
}

.float-divider {
  width: 1px;
  height: 20px;
  margin: 0 6px;
  background: #e5e7eb;
  flex-shrink: 0;
}

.float-tool {
  appearance: none;
  width: 34px;
  height: 34px;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 7px;
  background: transparent;
  color: #334155;
  cursor: pointer;
}

.float-tool svg {
  width: 18px;
  height: 18px;
  display: block;
}

.float-tool:hover:not(:disabled) {
  background: #f1f5f9;
  color: #0f172a;
}

.float-tool.active {
  background: color-mix(in srgb, var(--studio-accent) 14%, #fff);
  color: var(--studio-accent);
}

.float-tool:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.svg-host.draw-mode,
.svg-host.draw-mode :deep(path),
.svg-host.draw-mode :deep(rect),
.svg-host.draw-mode :deep(circle),
.svg-host.draw-mode :deep(ellipse),
.svg-host.draw-mode :deep(polygon),
.svg-host.draw-mode :deep(polyline),
.svg-host.draw-mode :deep(line),
.svg-host.draw-mode :deep(text),
.svg-host.draw-mode :deep(g),
.svg-host.draw-mode :deep(svg) {
  cursor: crosshair;
}

.svg-host.text-mode,
.svg-host.text-mode :deep(path),
.svg-host.text-mode :deep(rect),
.svg-host.text-mode :deep(circle),
.svg-host.text-mode :deep(ellipse),
.svg-host.text-mode :deep(polygon),
.svg-host.text-mode :deep(polyline),
.svg-host.text-mode :deep(line),
.svg-host.text-mode :deep(text),
.svg-host.text-mode :deep(g),
.svg-host.text-mode :deep(svg) {
  cursor: text;
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
.svg-host :deep(text),
.svg-host :deep(g) {
  cursor: pointer;
}

.text-edit-overlay {
  position: absolute;
  z-index: 6;
  pointer-events: auto;
  transform: translateY(-1px);
}

.text-edit-input {
  display: block;
  width: 100%;
  min-width: inherit;
  margin: 0;
  padding: 1px 4px;
  border: 1.5px solid #6366f1;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.94);
  color: inherit;
  font: inherit;
  font-size: inherit;
  line-height: 1.2;
  outline: none;
  box-shadow: 0 4px 16px rgba(15, 23, 42, 0.12);
  box-sizing: border-box;
}

.text-field {
  width: 100%;
  margin-top: 0.35rem;
  padding: 0.4rem 0.5rem;
  border: 1px solid var(--sf-border);
  border-radius: 6px;
  font-size: 0.85rem;
  box-sizing: border-box;
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
