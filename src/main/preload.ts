import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron'

// 需要在这里定义暴露给 ipcRender 的函数，然后在 ipcRender 的 preload.d.ts 中定义类型
// 只能暴露部分：https://www.electronjs.org/zh/docs/latest/tutorial/sandbox#preload-%E8%84%9A%E6%9C%AC
contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    on(channel: string, func: (...args: unknown[]) => void) {
      const subscription = (_event: IpcRendererEvent, ...args: unknown[]) => func(...args)
      ipcRenderer.on(channel, subscription)

      return () => {
        ipcRenderer.removeListener(channel, subscription)
      }
    },
    once(channel: string, func: (...args: unknown[]) => void) {
      ipcRenderer.once(channel, (_event, ...args) => func(...args))
    },
    send(channel: string, ...args: unknown[]) {
      ipcRenderer.send(channel, args)
    },
  },
})
