import styles from './index.module.scss'
import { Fragment, useEffect, useRef, useState } from 'react'
import WebviewTag = Electron.WebviewTag
import PrinterInfo = Electron.PrinterInfo
import IpcMessageEvent = Electron.IpcMessageEvent

const Print = () => {
  // 由于设置了 nodeintegration webpreferences 窗口不能使用 window.electron.ipcRenderer
  const ipcRenderer = window.require('electron').ipcRenderer

  const containerClass = `${styles['print']} ${'print' || ''}`

  const webviewRef = useRef<WebviewTag | null>(null)
  const [printList, setPrintList] = useState<PrinterInfo[]>([])

  useEffect(() => {
    ipcRenderer.send('ipc-printer-getList')

    ipcRenderer.once('ipc-printer-getList', (event, list: unknown) => {
      if (Array.isArray(list)) {
        setPrintList(list)
      }
    })

    initWebView()
  }, [])

  const initWebView = () => {
    const webview: WebviewTag | null = webviewRef.current

    webview?.addEventListener('ipc-message', (event: IpcMessageEvent) => {
      if (event.channel === 'webview-start-print') {
        // 如果收到<webview>传过来的事件，名为"webview-print-do"，就执行 webview.print打印方法，打印<webview>里面的内容。
        webview.print({
          silent: true, // 是否是静默打印
          printBackground: false,
          deviceName: 'RDPrinter',// 打印机的名称
          color:true, // 设置打印机是彩色还是灰色
          margins:{
            marginType:'default', // default、none、printableArea、custom。 如果选择自定义，您还需要指定顶部、底部、左侧和右侧
          },
          landscape:false ,// 网页是否应以横向模式打印
          scaleFactor:1, // 网页的比例
          pagesPerSheet:undefined, // 每页要打印的页数
          collate:undefined, // 网页是否应该对比
          // 要打印的页面范围
          pageRanges:[
            {
              from:0,// 要打印的第一页的索引 0 开始
              to:1, // 要打印的最后一页的索引 0 开始
            }
          ],
          duplexMode:"simplex" , //simplex、shortEdge 或 longEdge。 设置打印网页的双面模式
          dpi:undefined, //  {horizontal:x,vertical:x} 水平 dpi 垂直 dip
          header:'', // 要作为页眉打印的字符串
          footer:'', // 要作为页脚打印的字符串
          pageSize:'A4',// 指定打印文档的页面大小。可以是 A3、A4、A5、Legal、Letter、Tabloid 或包含以微米为单位的高度的对象
        })
      }
    })

    webview?.addEventListener('console-message', (e) => {
      console.log('%cWebview 中控制台信息:\r\n', 'color:red', e.message)
    })
  }

  const startPrint = () => {
    const data = {
      batchNo: '1',
      pn: '2',
    }

    webviewRef.current?.send('webview-set-html', data)
  }

  return (
    <div className={containerClass}>
      <div onClick={startPrint}>开始打印</div>

      {printList.map((p, pIndex) => {
        return (
          <Fragment key={pIndex}>
            <div>名字：{p.name}</div>
            <div>是否是默认：{p.isDefault.toString()}</div>
          </Fragment>
        )
      })}

      {/* printWindow.loadFile('xx.html'); */}
      {/* 也可以使用 mainWindow.webContents.print 进行打印 */}
      {/* https://www.jianshu.com/p/0de0d17106a9 */}
      <webview
        ref={webviewRef}
        id="printWebview"
        // src={'D:\\soft-dev\\code\\web\\frame\\React\\electron-printer\\assets\\html\\print\\index.html'}
        src={'file:///Users/user/Desktop/work-code/electron-printer/assets/html/print/index.html'}
        // 用于打印的属性
        //@ts-ignore
        // 需要在窗口设置中及 webview 中都设置 nodeintegration webpreferences
        nodeintegration={1} // 是为了让webview访问的页面具有Node集成, 并且可以使用像 require 和 process 这样的node APIs 去访问低层系统资源
        webpreferences={'contextIsolation=no'} // 也是同样的目的，为了在index.html中使用require。
      />
    </div>
  )
}

Print.defaultProps = {
  className: '',
}

export default Print