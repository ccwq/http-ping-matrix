/// <reference types="vite/client" />

declare const __APP_VERSION__: string

declare module '~icons/*' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}
