// docs/.vitepress/theme/index.ts
import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import { BoxCube, Card, Links, Pill } from '@theojs/lumen'
import type { Zoom } from 'medium-zoom'
import '@theojs/lumen/style'
import './var.css'
import './zoom.css'

let zoom: Zoom | undefined

const theme: Theme = {
  ...DefaultTheme,
  enhanceApp: ({ app, router }) => {
    app.component('Pill', Pill)
    app.component('Links', Links)
    app.component('Card', Card)
    app.component('BoxCube', BoxCube)

    // SSR 构建阶段（Vercel/VitePress 预渲染）没有 window/document，跳过图片放大逻辑
    if (typeof window === 'undefined') return

    // 初始化图片放大（进入页面和路由切换后）
    const initZoom = async () => {
      if (typeof window === 'undefined') return

      const mediumZoom = (await import('medium-zoom')).default
      if (zoom) zoom.detach()
      zoom = mediumZoom('.vp-doc img:not(.no-zoom)', {
        background: 'rgba(0, 0, 0, 0.7)',
      })
    }

    router.onAfterRouteChanged = () => void initZoom()
    void initZoom()
  },
}

export default theme
