// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt(
  {
    // SvgStudio 抽离自 svgforge，保留上游风格
    ignores: ['app/components/editor/**']
  }
)
