/* eslint-disable no-unused-expressions */
/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable no-undef */
import { contextBridge, ipcRenderer } from 'electron';
import startNotifications from './notification';
import './idle/seconds';
import './idle/status';
// import './db';
import './jsonDB';
import './mediaCache';
import startAutoLaunch from './auto-launch';
import insertMatrixAgent, { startCustomDNS } from './dns';

function domReady(condition: DocumentReadyState[] = ['complete', 'interactive']) {
  return new Promise((resolve) => {
    if (condition.includes(document.readyState)) {
      resolve(true);
    } else {
      document.addEventListener('readystatechange', () => {
        if (condition.includes(document.readyState)) {
          resolve(true);
        }
      });
    }
  });
}

const safeDOM = {
  append(parent: HTMLElement, child: HTMLElement) {
    if (!Array.from(parent.children).find((e) => e === child)) {
      return parent.appendChild(child);
    }
  },
  remove(parent: HTMLElement, child: HTMLElement) {
    if (Array.from(parent.children).find((e) => e === child)) {
      return parent.removeChild(child);
    }
  },
};

/**
 * https://tobiasahlin.com/spinkit
 * https://connoratherton.com/loaders
 * https://projects.lukehaas.me/css-loaders
 * https://matejkustec.github.io/SpinThatShit
 */
function useLoading() {
  const containerClass = 'container__loaders-css';
  const className = `loaders-css__square-spin`;
  const styleContent = `
@keyframes square-spin {
  25% { transform: perspective(100px) rotateX(180deg) rotateY(0); }
  50% { transform: perspective(100px) rotateX(180deg) rotateY(180deg); }
  75% { transform: perspective(100px) rotateX(0) rotateY(180deg); }
  100% { transform: perspective(100px) rotateX(0) rotateY(0); }
}
.${className} .${containerClass} > div {
  animation-fill-mode: both;
  width: 50px;
  height: 50px;
  background: #fff;
  animation: square-spin 3s 0s cubic-bezier(0.09, 0.57, 0.49, 0.9) infinite;
}
.app-loading-wrap .${containerClass} {
  background: #282c34;
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}
.app-loading-wrap {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  z-index: 9;
}
body.electron-mode .app-loading-wrap {
  top: 29px !important;
}
    `;
  const oStyle = document.createElement('style');
  const oDiv = document.createElement('div');

  oStyle.id = 'app-loading-style';
  oStyle.innerHTML = styleContent;
  oDiv.className = 'app-loading-wrap root-electron-style-solo';
  oDiv.innerHTML = `<div class="${className} root-electron-style-solo"><div class="${containerClass} root-electron-style-solo"><div></div></div></div>`;

  return {
    appendLoading() {
      safeDOM.append(document.head, oStyle);
      safeDOM.append(document.body, oDiv);
    },
    removeLoading() {
      safeDOM.remove(document.head, oStyle);
      safeDOM.remove(document.body, oDiv);
    },
  };
}

// ----------------------------------------------------------------------

const { appendLoading, removeLoading } = useLoading();
startAutoLaunch({ appendLoading, removeLoading });
contextBridge.exposeInMainWorld('useLoadingElectron', { appendLoading, removeLoading });
domReady().then(appendLoading);

window.onmessage = (ev) => {
  ev.data.payload === 'removeLoading' && removeLoading();
};

contextBridge.exposeInMainWorld('desktopNotification', (options: object) =>
  startNotifications(options),
);

contextBridge.exposeInMainWorld('nodeFetch', insertMatrixAgent);
contextBridge.exposeInMainWorld('startCustomDNS', startCustomDNS);
contextBridge.exposeInMainWorld('focusAppWindow', () =>
  ipcRenderer.send('tiny-focus-window', true),
);

contextBridge.exposeInMainWorld('openDevTools', () => ipcRenderer.send('openDevTools', true));
contextBridge.exposeInMainWorld('getElectronExe', () => process.execPath);

contextBridge.exposeInMainWorld('electronWindowIsVisible', (isVisible: boolean) =>
  ipcRenderer.send('windowIsVisible', isVisible),
);

ipcRenderer.on('ping', (_event, arg) => {
  console.log('[electron] [ping] ', arg);
});

// eslint-disable-next-line @typescript-eslint/ban-types
let electronResize: Function | null = null;
ipcRenderer.on('resize', (event, data) => {
  if (typeof electronResize === 'function') {
    electronResize(data);
  }
});

// eslint-disable-next-line @typescript-eslint/ban-types
contextBridge.exposeInMainWorld('setElectronResize', (callback: Function) => {
  electronResize = callback;
});

contextBridge.exposeInMainWorld('changeTrayIcon', (img: string) => {
  if (
    img === 'cinny.ico' ||
    img === 'cinny-unread-red.ico' ||
    img === 'cinny.png' ||
    img === 'cinny-unread-red.png'
  ) {
    ipcRenderer.send('change-tray-icon', img);
  }
});

contextBridge.exposeInMainWorld('changeAppIcon', (img: string) => {
  if (
    img === 'cinny.ico' ||
    img === 'cinny-unread-red.ico' ||
    img === 'cinny.png' ||
    img === 'cinny-unread-red.png'
  ) {
    ipcRenderer.send('change-app-icon', img);
  }
});

setTimeout(removeLoading, 4999);

// App Status
let appShow = true;
ipcRenderer.on('tiny-app-is-show', (event, data) => {
  if (typeof data === 'boolean') appShow = data;
});

contextBridge.exposeInMainWorld('getElectronShowStatus', () => appShow);

let isMaximized: any = false;
ipcRenderer.on('window-is-maximized', (_event, arg) => {
  isMaximized = arg;
});

const electronWindowStatus = {
  maximize: () => {
    ipcRenderer.send('window-maximize', true);
  },
  unmaximize: () => {
    ipcRenderer.send('window-unmaximize', true);
  },
  minimize: () => {
    ipcRenderer.send('window-minimize', true);
  },
  close: () => {
    ipcRenderer.send('window-close', true);
  },
  isMaximized: () => isMaximized,
};

contextBridge.exposeInMainWorld('electronWindowStatus', electronWindowStatus);
