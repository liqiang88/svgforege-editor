export type DomLayerNode = {
  id: string
  label: string
  type: string
  indexLabel: string
  visible: boolean
  depth: number
  children: DomLayerNode[]
  /** True for the top-level SVG root row (OpenSVG-style). */
  isRoot?: boolean
}

export const SVG_ROOT_ID = 'svg-root'
