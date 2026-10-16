/** Drawing tools for SvgStudio: shapes, polyline, pencil, text. */

import type { SvgPoint } from './svgInteract'

export type EditorTool = 'select' | 'rect' | 'circle' | 'line' | 'polyline' | 'pencil' | 'text'

export type DrawStyle = {
  fill: string
  fillNone: boolean
  stroke: string
  strokeNone: boolean
  strokeWidth: number
}

export const DRAW_TOOLS: EditorTool[] = ['select', 'rect', 'circle', 'line', 'polyline', 'pencil', 'text']

export const TOOL_LABELS: Record<EditorTool, string> = {
  select: 'Select',
  rect: 'Rect',
  circle: 'Circle',
  line: 'Line',
  polyline: 'Polyline',
  pencil: 'Pencil',
  text: 'Text',
}

export function isDrawTool(tool: EditorTool): tool is Exclude<EditorTool, 'select'> {
  return tool !== 'select'
}

export function strokeOnlyTool(tool: EditorTool): boolean {
  return tool === 'line' || tool === 'polyline' || tool === 'pencil'
}

export function isTextTool(tool: EditorTool): boolean {
  return tool === 'text'
}

/** Map client coords into an element's local SVG space (uses element's screen CTM). */
export function clientToElementLocal(el: SVGGraphicsElement, clientX: number, clientY: number): SvgPoint {
  const svg = el.ownerSVGElement
  if (!svg) return { x: 0, y: 0 }
  const ctm = el.getScreenCTM() || svg.getScreenCTM()
  if (!ctm) return { x: 0, y: 0 }
  const pt = svg.createSVGPoint()
  pt.x = clientX
  pt.y = clientY
  const local = pt.matrixTransform(ctm.inverse())
  return { x: local.x, y: local.y }
}

export function applyPaint(el: Element, style: DrawStyle, forceStrokeOnly = false) {
  if (forceStrokeOnly || style.fillNone) el.setAttribute('fill', 'none')
  else el.setAttribute('fill', style.fill)

  if (style.strokeNone && !forceStrokeOnly) {
    el.setAttribute('stroke', 'none')
    el.removeAttribute('stroke-width')
  } else {
    const stroke = style.strokeNone ? style.stroke || '#1a2332' : style.stroke
    el.setAttribute('stroke', stroke)
    el.setAttribute('stroke-width', String(Math.max(0.5, style.strokeWidth || 2)))
    el.setAttribute('stroke-linecap', 'round')
    el.setAttribute('stroke-linejoin', 'round')
  }
}

export function createDrawElement(
  doc: Document,
  tool: Exclude<EditorTool, 'select' | 'text'>,
  start: SvgPoint,
  style: DrawStyle,
  id: string,
): SVGElement {
  const ns = 'http://www.w3.org/2000/svg'
  let el: SVGElement

  if (tool === 'rect') {
    el = doc.createElementNS(ns, 'rect')
    el.setAttribute('x', String(round(start.x)))
    el.setAttribute('y', String(round(start.y)))
    el.setAttribute('width', '0')
    el.setAttribute('height', '0')
    applyPaint(el, style, false)
  } else if (tool === 'circle') {
    el = doc.createElementNS(ns, 'circle')
    el.setAttribute('cx', String(round(start.x)))
    el.setAttribute('cy', String(round(start.y)))
    el.setAttribute('r', '0')
    applyPaint(el, style, false)
  } else if (tool === 'line') {
    el = doc.createElementNS(ns, 'line')
    el.setAttribute('x1', String(round(start.x)))
    el.setAttribute('y1', String(round(start.y)))
    el.setAttribute('x2', String(round(start.x)))
    el.setAttribute('y2', String(round(start.y)))
    applyPaint(el, style, true)
  } else {
    // polyline | pencil → path
    el = doc.createElementNS(ns, 'path')
    el.setAttribute('d', `M ${round(start.x)} ${round(start.y)}`)
    applyPaint(el, style, true)
  }

  el.setAttribute('data-editor-id', id)
  return el
}

/** Place a `<text>` node at `start` (user units). */
export function createTextElement(
  doc: Document,
  start: SvgPoint,
  style: DrawStyle,
  id: string,
  fontSize: number,
  content = 'Text',
): SVGTextElement {
  const ns = 'http://www.w3.org/2000/svg'
  const el = doc.createElementNS(ns, 'text') as SVGTextElement
  el.setAttribute('x', String(round(start.x)))
  el.setAttribute('y', String(round(start.y)))
  el.setAttribute('font-size', String(Math.max(0.5, round(fontSize))))
  el.setAttribute('font-family', 'system-ui, -apple-system, Segoe UI, sans-serif')
  el.setAttribute('dominant-baseline', 'hanging')
  el.setAttribute('text-anchor', 'start')
  const fill =
    style.fillNone || !style.fill
      ? style.strokeNone
        ? '#1a2332'
        : style.stroke || '#1a2332'
      : style.fill
  el.setAttribute('fill', fill)
  el.setAttribute('stroke', 'none')
  el.textContent = content
  el.setAttribute('data-editor-id', id)
  return el
}

export function updateRectGeometry(el: Element, start: SvgPoint, cur: SvgPoint, keepAspect: boolean) {
  let x = Math.min(start.x, cur.x)
  let y = Math.min(start.y, cur.y)
  let w = Math.abs(cur.x - start.x)
  let h = Math.abs(cur.y - start.y)
  if (keepAspect) {
    const s = Math.max(w, h)
    w = s
    h = s
    x = cur.x < start.x ? start.x - s : start.x
    y = cur.y < start.y ? start.y - s : start.y
  }
  el.setAttribute('x', String(round(x)))
  el.setAttribute('y', String(round(y)))
  el.setAttribute('width', String(round(Math.max(w, 0))))
  el.setAttribute('height', String(round(Math.max(h, 0))))
}

export function updateCircleGeometry(el: Element, start: SvgPoint, cur: SvgPoint, keepAspect: boolean) {
  const dx = cur.x - start.x
  const dy = cur.y - start.y
  if (keepAspect) {
    const r = Math.hypot(dx, dy)
    el.setAttribute('cx', String(round(start.x)))
    el.setAttribute('cy', String(round(start.y)))
    el.setAttribute('r', String(round(Math.max(r, 0))))
    return
  }
  const cx = start.x + dx / 2
  const cy = start.y + dy / 2
  const r = Math.max(Math.abs(dx), Math.abs(dy)) / 2
  el.setAttribute('cx', String(round(cx)))
  el.setAttribute('cy', String(round(cy)))
  el.setAttribute('r', String(round(Math.max(r, 0))))
}

export function updateLineGeometry(el: Element, start: SvgPoint, cur: SvgPoint, keepAspect: boolean) {
  let x2 = cur.x
  let y2 = cur.y
  if (keepAspect) {
    const dx = cur.x - start.x
    const dy = cur.y - start.y
    if (Math.abs(dx) >= Math.abs(dy)) y2 = start.y
    else x2 = start.x
  }
  el.setAttribute('x1', String(round(start.x)))
  el.setAttribute('y1', String(round(start.y)))
  el.setAttribute('x2', String(round(x2)))
  el.setAttribute('y2', String(round(y2)))
}

export function pointsToPathD(points: SvgPoint[], closed = false): string {
  if (!points.length) return ''
  const first = points[0]!
  let d = `M ${round(first.x)} ${round(first.y)}`
  for (let i = 1; i < points.length; i++) {
    const p = points[i]!
    d += ` L ${round(p.x)} ${round(p.y)}`
  }
  if (closed && points.length > 2) d += ' Z'
  return d
}

/** Drop points closer than `minDist` to the previous kept point. Always keeps first/last. */
export function thinPoints(points: SvgPoint[], minDist = 1.5): SvgPoint[] {
  if (points.length <= 2) return points.slice()
  const first = points[0]!
  const last = points[points.length - 1]!
  const out: SvgPoint[] = [first]
  for (let i = 1; i < points.length - 1; i++) {
    const prev = out[out.length - 1]!
    const p = points[i]!
    if (Math.hypot(p.x - prev.x, p.y - prev.y) >= minDist) out.push(p)
  }
  out.push(last)
  return out
}

export function shapeHasSize(tool: EditorTool, el: Element): boolean {
  if (tool === 'rect') {
    return parseFloat(el.getAttribute('width') || '0') > 0.5 && parseFloat(el.getAttribute('height') || '0') > 0.5
  }
  if (tool === 'circle') {
    return parseFloat(el.getAttribute('r') || '0') > 0.5
  }
  if (tool === 'line') {
    const x1 = parseFloat(el.getAttribute('x1') || '0')
    const y1 = parseFloat(el.getAttribute('y1') || '0')
    const x2 = parseFloat(el.getAttribute('x2') || '0')
    const y2 = parseFloat(el.getAttribute('y2') || '0')
    return Math.hypot(x2 - x1, y2 - y1) > 0.5
  }
  return true
}

export function pathHasEnoughPoints(points: SvgPoint[], min = 2): boolean {
  return points.length >= min
}

function round(n: number): number {
  return Math.round(n * 1000) / 1000
}
