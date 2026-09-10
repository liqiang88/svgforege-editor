/** Pointer → SVG parent-local coordinates for drag / resize. */

export type ResizeHandle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w'

export const RESIZE_HANDLES: ResizeHandle[] = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w']

export type SvgPoint = { x: number; y: number }

export type SvgBBox = { x: number; y: number; width: number; height: number }

export function clientToParentLocal(el: Element, clientX: number, clientY: number): SvgPoint {
  const svg = (el as SVGElement).ownerSVGElement
  if (!svg) return { x: 0, y: 0 }
  const parent = el.parentNode as SVGGraphicsElement | null
  const ctm = parent?.getScreenCTM?.() || svg.getScreenCTM()
  if (!ctm) return { x: 0, y: 0 }
  const pt = svg.createSVGPoint()
  pt.x = clientX
  pt.y = clientY
  const local = pt.matrixTransform(ctm.inverse())
  return { x: local.x, y: local.y }
}

/**
 * Axis-aligned screen bounds for an SVG shape, including stroke.
 * Browsers' getBoundingClientRect / getBBox often ignore stroke on fill="none"
 * paths, so the selection box sits on the stroke centerline ("in the middle").
 */
export function elementScreenRect(el: SVGGraphicsElement): {
  left: number
  top: number
  width: number
  height: number
} {
  const fallback = () => {
    const r = el.getBoundingClientRect()
    return { left: r.left, top: r.top, width: r.width, height: r.height }
  }

  const svg = el.ownerSVGElement
  if (!svg) return fallback()

  let b: DOMRect
  try {
    b = el.getBBox()
  } catch {
    return fallback()
  }

  const sw = hasPaintingStroke(el) ? strokeWidthUserUnits(el) : 0
  const half = sw / 2
  const x = b.x - half
  const y = b.y - half
  const w = Math.max(b.width + sw, sw > 0 ? sw : 0.01)
  const h = Math.max(b.height + sw, sw > 0 ? sw : 0.01)

  const ctm = el.getScreenCTM()
  if (!ctm) return fallback()

  const pt = svg.createSVGPoint()
  const corners = [
    [x, y],
    [x + w, y],
    [x, y + h],
    [x + w, y + h],
  ].map(([px, py]) => {
    pt.x = px
    pt.y = py
    return pt.matrixTransform(ctm)
  })

  const left = Math.min(...corners.map((p) => p.x))
  const right = Math.max(...corners.map((p) => p.x))
  const top = Math.min(...corners.map((p) => p.y))
  const bottom = Math.max(...corners.map((p) => p.y))
  return { left, top, width: right - left, height: bottom - top }
}

/** Resolved stroke-width in SVG user units (walks inheritance). */
export function strokeWidthUserUnits(el: Element): number {
  let cur: Element | null = el
  while (cur) {
    const attr = cur.getAttribute('stroke-width')
    if (attr != null && attr !== '') {
      const n = parseFloat(attr)
      return Number.isFinite(n) ? n : 0
    }
    const styleAttr = cur.getAttribute('style')
    if (styleAttr) {
      const m = /(?:^|;)\s*stroke-width\s*:\s*([^;]+)/i.exec(styleAttr)
      if (m) {
        const n = parseFloat(m[1].trim())
        if (Number.isFinite(n)) return n
      }
    }
    if (cur.tagName.toLowerCase() === 'svg') break
    cur = cur.parentElement
  }
  return 1
}

function hasPaintingStroke(el: Element): boolean {
  let cur: Element | null = el
  while (cur) {
    const attr = cur.getAttribute('stroke')
    if (attr != null && attr !== '') return attr.toLowerCase() !== 'none'
    const styleAttr = cur.getAttribute('style')
    if (styleAttr) {
      const m = /(?:^|;)\s*stroke\s*:\s*([^;]+)/i.exec(styleAttr)
      if (m) return m[1].trim().toLowerCase() !== 'none'
    }
    if (cur.tagName.toLowerCase() === 'svg') break
    cur = cur.parentElement
  }
  try {
    const stroke = window.getComputedStyle(el).stroke
    return !!stroke && stroke !== 'none'
  } catch {
    return false
  }
}

export function moveTransform(origTransform: string, dx: number, dy: number): string {
  const t = `translate(${round(dx)} ${round(dy)})`
  return origTransform ? `${t} ${origTransform}` : t
}

/**
 * Build transform that scales local geometry around the handle's opposite corner,
 * then applies the original transform. `sx`/`sy` are typically derived from the
 * axis-aligned screen bbox so HTML resize handles stay accurate.
 */
export function resizeTransform(
  origTransform: string,
  bbox: SvgBBox,
  handle: ResizeHandle,
  sx: number,
  sy: number,
): string {
  const safeSx = Number.isFinite(sx) && sx > 0 ? sx : 1
  const safeSy = Number.isFinite(sy) && sy > 0 ? sy : 1
  const anchor = resizeAnchor(bbox, handle)
  const scale = `translate(${round(anchor.x)} ${round(anchor.y)}) scale(${round(safeSx)} ${round(safeSy)}) translate(${round(-anchor.x)} ${round(-anchor.y)})`
  // Rightmost applied first: scale local geometry, then original transforms.
  return origTransform ? `${origTransform} ${scale}` : scale
}

/** Map a screen-space drag to scale factors against the starting client rect. */
export function scaleFromScreenDrag(
  handle: ResizeHandle,
  startRect: { left: number; top: number; width: number; height: number },
  clientX: number,
  clientY: number,
  keepAspect: boolean,
): { sx: number; sy: number } {
  const minPx = 4
  let left = startRect.left
  let top = startRect.top
  let right = startRect.left + startRect.width
  let bottom = startRect.top + startRect.height

  if (handle.includes('e')) right = clientX
  if (handle.includes('w')) left = clientX
  if (handle.includes('s')) bottom = clientY
  if (handle.includes('n')) top = clientY

  let newW = Math.max(minPx, right - left)
  let newH = Math.max(minPx, bottom - top)

  // Edge handles: lock the unused axis
  if (handle === 'n' || handle === 's') newW = startRect.width
  if (handle === 'e' || handle === 'w') newH = startRect.height

  if (keepAspect && startRect.width > 0 && startRect.height > 0) {
    const ratio = startRect.width / startRect.height
    if (handle === 'n' || handle === 's') {
      newW = newH * ratio
    } else if (handle === 'e' || handle === 'w') {
      newH = newW / ratio
    } else {
      const sxCand = newW / startRect.width
      const syCand = newH / startRect.height
      const s = Math.abs(sxCand - 1) > Math.abs(syCand - 1) ? sxCand : syCand
      newW = Math.max(minPx, startRect.width * s)
      newH = Math.max(minPx, startRect.height * s)
    }
  }

  return {
    sx: newW / Math.max(startRect.width, 1e-6),
    sy: newH / Math.max(startRect.height, 1e-6),
  }
}

function resizeAnchor(bbox: SvgBBox, handle: ResizeHandle): SvgPoint {
  const xL = bbox.x
  const xR = bbox.x + bbox.width
  const xM = bbox.x + bbox.width / 2
  const yT = bbox.y
  const yB = bbox.y + bbox.height
  const yM = bbox.y + bbox.height / 2

  switch (handle) {
    case 'nw':
      return { x: xR, y: yB }
    case 'n':
      return { x: xM, y: yB }
    case 'ne':
      return { x: xL, y: yB }
    case 'e':
      return { x: xL, y: yM }
    case 'se':
      return { x: xL, y: yT }
    case 's':
      return { x: xM, y: yT }
    case 'sw':
      return { x: xR, y: yT }
    case 'w':
      return { x: xR, y: yM }
  }
}

function round(n: number): number {
  return Math.round(n * 1000) / 1000
}
