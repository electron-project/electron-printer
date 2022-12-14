// 教程：https://cloud.tencent.com/developer/article/1781419
// 教程：http://www.flyknows.com/2020/08/13/deeplink%E6%89%93%E5%BC%80%E5%BA%94%E7%94%A8/
// 教程：https://juejin.cn/post/6887845625447055367
// 文档：https://www.electronjs.org/zh/docs/latest/tutorial/launch-app-from-url-in-another-app#windows-%E4%B8%8B%E4%BB%A3%E7%A0%81
// Nsis 钩子详细说明：https://www.electron.build/configuration/nsis

import { app, BrowserWindow } from 'electron'
import { PROTOCOL } from '@/main/constant/url-scheme'
import * as process from 'process'
import Platform from '@/main/constant/platform'
import { getPrintWindow } from '@/main/window/print'
import getProgramExecParams from '@/main/utils/get-exec-params'

// 获取 app 锁，防止启动第二个实例
//    获取失败则代表有实例已经运行了
//    如果当前进程是应用程序的主要实例，则此方法返回true
// 在 macOS 上, 当用户尝试在 Finder 中打开您的应用程序的第二个实例时, 系统会通过发出 open-file 和 open-url 事件来自动强制执行单个实例。
// 但是当用户在命令行中启动应用程序时, 系统的单实例机制将被绕过, 您必须手动调用此方法来确保单实例
export function checkSchemeSetup() {
  const win = getPrintWindow()
  if (!win) return

  // 获取单实例锁
  const gotTheLock = app.requestSingleInstanceLock()
  // windows如果是通过url schema启动则发出事件处理
  // 启动参数超过1个才可能是通过url schema启动
  // mac下process.argv只有一个
  if (!Platform.isMac && process.argv.length > 1 && !gotTheLock) {
    // 如果获取失败，说明已经有实例在运行了，直接退出 app.quit 会导致闪屏 app.exit 强制退出
    app.exit(0)
  } else {
    // console.log(process.argv); 可以获取第一次没有打开过 app 的参数
    listenerInstance(win)
  }
}

export function registerLink() {
  // process.defaultApp 当应用程序启动时被作为参数传递给默认应用，这个属性在主进程中是 true，否则是undefined
  if (process.defaultApp && !app.isPackaged && process.argv.length >= 2) {
    //  将当前可执行文件的设置为协议(也就是 URI scheme) 的默认处理程序。 该方法允许你将应用更深入地集成到操作系统中。
    //  一旦注册了，所有 your-protocol:// 开头的链接将使用当前可执行文件打开。 整个链接，包括协议部分，将作为参数传递给你的应用程序。
    // 后边两个参数是 windows 特有
    app.setAsDefaultProtocolClient(PROTOCOL, process.execPath, getProgramExecParams())
  } else {
    app.setAsDefaultProtocolClient(PROTOCOL)
  }
}

function listenerInstance(win: BrowserWindow) {
  // Windows
  // 当第二个实例被执行并且调用 app.requestSingleInstanceLock() 时，这个事件将在你的应用程序的首个实例中触发
  // argv 是第二个实例的命令行参数的数组, workingDirectory 是这个实例当前工作目录。 通常, 应用程序会激活窗口并且取消最小化来响应
  app.on('second-instance', (event, argv) => {
    if (Platform.isWindows) {
      if (win) {
        if (win.isMinimized()) win.restore()
        win.focus()
      }

      const prefix = `${PROTOCOL}:`
      const url = argv.find((arg, i) => arg.startsWith(prefix))
      if (url) urlSchemeParams(url)
    }
  })

  // macOS
  // Mac: app.isDefaultProtocolClient(protocol) 当前程序是否为协议的处理程序。
  app.on('open-url', (event, url) => {
    urlSchemeParams(url)
  })
}

function urlSchemeParams(url: string) {
  // printApp://?name=风扇&code=1243&categoryName=其他&link=https://erp.davincimotor.com/e/X2t8khUa-jayGQ752R6JR
  const urlObj = new URL(url)
  const { searchParams } = urlObj

  let name = searchParams.get('name')
  let code = searchParams.get('code')
  let categoryName = searchParams.get('categoryName')
  let link = searchParams.get('link')

  const printWin = getPrintWindow()
  printWin?.webContents.send('DEEP_LINK_PRINT_PARAMS', { name, code, categoryName, link })
}
