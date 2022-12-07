import { app, BrowserWindow } from 'electron'
import path from 'path'
import { isDev } from '@/constant/env'
import installExtensions from '@/main/utils/plugin/extensions'
import AppUpdater from '@/main/utils/plugin/auto-update'
import { resolveHtmlPath } from '@/main/utils/path'
import { assetsPath } from '@/constant/icon'
import { initEvent } from '@/main/window/main/event'
import initTray from '@/main/window/main/tray'
import createMenu from '@/main/window/main/menu'
import initElectronRemote from '@/main/window/main/electron-remote'
import { regGlobalShortcut } from '@/main/window/main/global-shortcut'
import initPrintIpcMain from '@/main/ipc/print'
import * as process from 'process'

const createWindow = async () => {
  let mainWindow: BrowserWindow | null = new BrowserWindow({
    show: false, // 为了让初始化窗口显示无闪烁，先关闭显示，等待加载完成后再显示。
    width: 1024,
    height: 728,
    icon: assetsPath('icon.png'),
    webPreferences: {
      preload: app.isPackaged ? path.join(__dirname, 'preload.js') : path.join(process.cwd(), '.erb/dll/preload.js'),
      webviewTag: true, // 启用 webview 标签功能
      nodeIntegration: true,
      contextIsolation: false,
    },
  })
  mainWindow.show()
  global.win = mainWindow

  // objc[85955]: Class WebSwapCGLLayer is implemented in both xxxxx One of the two will be used. Which one is undefined.
  // Failed to fetch extension, trying 4 more times
  // 是因为安装开发者工具 没有外网
  // 必须在 loadURL 之前进行安装
  // if (isDev) await installExtensions();

  initTray(mainWindow)
  createMenu(mainWindow)
  regGlobalShortcut(mainWindow)

  initEvent(mainWindow)
  await initElectronRemote(mainWindow)

  initPrintIpcMain(mainWindow)
  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  AppUpdater().then()

  // 设置为最顶层
  // win.setAlwaysOnTop(true)
  // 可以让主进程打开文件或者一个链接;
  // win.loadURL(`www.baidu.com`)
  await mainWindow.loadURL(resolveHtmlPath('index.html'))
}

export default createWindow
