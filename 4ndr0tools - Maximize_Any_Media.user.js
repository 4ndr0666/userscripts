// ==UserScript==
// @name         4ndr0tools - Maximize_Any_Media
// @namespace    https://github.com/4ndr0666/userscripts
// @version      2.0.0
// @author       4ndr0666
// @description  Maximize + Pip controls to any media anywhere - video, images, embedded and shadow-DOM players, on any site. 3lectric-Glass spec. Ψ
// @license      UNLICENSED - RED TEAM USE ONLY
// @include      *
// @exclude      *www.w3school.com.*
// @exclude      *www.w3schools.com.*
// @icon         data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20128%20128%22%20fill%3D%22none%22%20stroke%3D%22%2300E5FF%22%20stroke-width%3D%223%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22M%2064%2C12%20A%2052%2C52%200%201%201%2063.9%2C12%20Z%22%20stroke-dasharray%3D%2221.78%2021.78%22%20stroke-width%3D%222%22%2F%3E%3Cpath%20d%3D%22M%2064%2C20%20A%2044%2C44%200%201%201%2063.9%2C20%20Z%22%20stroke-dasharray%3D%2210%2010%22%20stroke-width%3D%221.5%22%20opacity%3D%220.7%22%2F%3E%3Cpath%20d%3D%22M64%2030%20L91.3%2047%20L91.3%2081%20L64%2098%20L36.7%2081%20L36.7%2047%20Z%22%2F%3E%3Ctext%20x%3D%2264%22%20y%3D%2267%22%20text-anchor%3D%22middle%22%20dominant-baseline%3D%22middle%22%20fill%3D%22%2300E5FF%22%20stroke%3D%22none%22%20font-size%3D%2256%22%20font-weight%3D%22700%22%20font-family%3D%22Cinzel%20Decorative%2C%20serif%22%3E%CE%A8%3C%2Ftext%3E%3C%2Fsvg%3E
// @downloadURL  https://raw.githubusercontent.com/4ndr0666/glm/main/maximizeanymedia.user.js
// @updateURL    https://raw.githubusercontent.com/4ndr0666/glm/main/maximizeanymedia.user.js
// @run-at       document-end
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// ==/UserScript==

;(() => {
  // Paradigm: Event-Driven Userscript Overlay — module-scoped state only, zero
  // window-global pollution; media discovery is delegated through document-level
  // event listeners (composed-path walking), never through polling loops.
  const SCRIPT = {
    name: "4ndr0tools - Maximize_Any_Media",
    version: "7.0.0-Ψ",
    spec: "3lectric-Glass",
  }

  const gv = {
    isFull: false,
    isIframe: false,
    autoCheckCount: 0,
    booted: false,
    tipTimers: { show: 0, hide: 0, remove: 0 },
  }

  // HTML5 rules [outermost player container], applicable to adaptive-size HTML5 players that cannot be automatically detected
  const html5Rules = {
    "www.acfun.cn": [".player-container .player"],
    "www.bilibili.com": ["#bilibiliPlayer"],
    "www.douyu.com": ["#js-player-video-case"],
    "www.huya.com": ["#videoContainer"],
    "www.twitch.tv": [".player"],
    "www.youtube.com": ["#movie_player"],
    "www.yy.com": ["#player"],
    "*weibo.com": ['[aria-label="Video Player"]', ".html5-video-live .html5-video"],
    "v.huya.com": ["#video_embed_flash>div"],
  }

  // Generic HTML5 players
  const generalPlayerRules = [".dplayer", ".video-js", ".jwplayer", "[data-player]"]

  // Media node names that qualify for overlay controls
  const MEDIA_TAGS = ["VIDEO", "IMG", "OBJECT", "EMBED"]

  if (window.top !== window.self) {
    gv.isIframe = true
  }

  if (navigator.language.toLocaleLowerCase() == "zh-cn") {
    gv.btnText = {
      max: "网页全屏",
      pip: "画中画",
      tip: "Iframe内视频，请用鼠标点击视频后重试",
      pipUnsupported: "当前浏览器或媒体不支持画中画",
      pipCors: "跨域图片无法进入画中画（CORS 保护）",
      cHotkeys: "快捷键 (Esc/F2/Alt+S)",
      cImgMax: "图片最大化",
      cImgPip: "图片画中画",
      cShadow: "Shadow-DOM 深度扫描",
      cMinW: "最小宽度 (px)",
      cMinH: "最小高度 (px)",
      cOpacity: "按钮不透明度",
      cReset: "重置",
      cDone: "完成",
      cStatus: "状态",
    }
  } else {
    gv.btnText = {
      max: "Maximize",
      pip: "PicInPic",
      tip: "Iframe video. Please click on the video and try again",
      pipUnsupported: "Picture-in-Picture is unavailable for this browser or media",
      pipCors: "Cross-origin image cannot enter PiP (CORS-protected)",
      cHotkeys: "Hotkeys (Esc/F2/Alt+S)",
      cImgMax: "Image maximize",
      cImgPip: "Image PiP",
      cShadow: "Shadow-DOM deep scan",
      cMinW: "Min width (px)",
      cMinH: "Min height (px)",
      cOpacity: "Button opacity",
      cReset: "RESET",
      cDone: "DONE",
      cStatus: "status",
    }
  }
  // Ψ settings — dual GM/localStorage backend, schema-tolerant load, idempotent save.
  // Defaults reproduce every baseline behavioral constant exactly.
  const settings = {
    KEY: "MAM_SETTINGS_V7",
    LS_KEY: "mam.settings.v7",
    cache: {},
    DEFAULTS: {
      hotkeys: true,
      imageMaximize: true,
      imagePip: true,
      shadowScan: true,
      minMediaWidth: 399,
      minMediaHeight: 220,
      buttonOpacity: 0.9,
      consolePos: null,
    },
    load() {
      let stored = null
      try {
        if (typeof GM_getValue === "function") {
          stored = GM_getValue(this.KEY, null)
        }
      } catch (e) {
        tool.print("settings GM read failed: " + e.message)
      }
      if (stored === null) {
        try {
          const raw = localStorage.getItem(this.LS_KEY)
          if (raw) {
            stored = JSON.parse(raw)
          }
        } catch (e) {
          tool.print("settings LS read failed: " + e.message)
        }
      }
      this.cache = Object.assign({}, this.DEFAULTS, this.valid(stored))
    },
    valid(obj) {
      const out = {}
      if (!obj || typeof obj !== "object") {
        return out
      }
      const clampNum = (value, min, max, dflt) =>
        typeof value === "number" && isFinite(value) ? Math.min(max, Math.max(min, value)) : dflt
      out.hotkeys = typeof obj.hotkeys === "boolean" ? obj.hotkeys : this.DEFAULTS.hotkeys
      out.imageMaximize = typeof obj.imageMaximize === "boolean" ? obj.imageMaximize : this.DEFAULTS.imageMaximize
      out.imagePip = typeof obj.imagePip === "boolean" ? obj.imagePip : this.DEFAULTS.imagePip
      out.shadowScan = typeof obj.shadowScan === "boolean" ? obj.shadowScan : this.DEFAULTS.shadowScan
      out.minMediaWidth = clampNum(obj.minMediaWidth, 0, 10000, this.DEFAULTS.minMediaWidth)
      out.minMediaHeight = clampNum(obj.minMediaHeight, 0, 10000, this.DEFAULTS.minMediaHeight)
      out.buttonOpacity = clampNum(obj.buttonOpacity, 0.3, 1, this.DEFAULTS.buttonOpacity)
      out.consolePos =
        obj.consolePos && typeof obj.consolePos === "object" && isFinite(obj.consolePos.x) && isFinite(obj.consolePos.y)
          ? { x: obj.consolePos.x, y: obj.consolePos.y }
          : null
      return out
    },
    save(partial) {
      Object.assign(this.cache, this.valid(Object.assign({}, this.cache, partial)))
      const json = JSON.stringify(this.cache)
      try {
        if (typeof GM_setValue === "function") {
          GM_setValue(this.KEY, json)
        }
      } catch (e) {
        tool.print("settings GM write failed: " + e.message)
      }
      try {
        localStorage.setItem(this.LS_KEY, json)
      } catch (e) {
        tool.print("settings LS write failed: " + e.message)
      }
    },
    get(key) {
      return this.cache[key]
    },
    reset() {
      this.cache = Object.assign({}, this.DEFAULTS)
      this.save({})
    },
  }

  const tool = {
    print(log) {
      const now = new Date()
      const year = now.getFullYear()
      const month = (now.getMonth() + 1 < 10 ? "0" : "") + (now.getMonth() + 1)
      const day = (now.getDate() < 10 ? "0" : "") + now.getDate()
      const hour = (now.getHours() < 10 ? "0" : "") + now.getHours()
      const minute = (now.getMinutes() < 10 ? "0" : "") + now.getMinutes()
      const second = (now.getSeconds() < 10 ? "0" : "") + now.getSeconds()
      const timenow = "[" + year + "-" + month + "-" + day + " " + hour + ":" + minute + ":" + second + "]"
      console.log(timenow + "[Maximize Video] > " + log)
    },
    getRect(element) {
      const rect = element.getBoundingClientRect()
      const scroll = tool.getScroll()
      return {
        pageX: rect.left + scroll.left,
        pageY: rect.top + scroll.top,
        screenX: rect.left,
        screenY: rect.top,
      }
    },
    isHalfFullClient(element) {
      const client = tool.getClient()
      const rect = tool.getRect(element)
      if (
        (Math.abs(client.width - element.offsetWidth) < 21 && rect.screenX < 20) ||
        (Math.abs(client.height - element.offsetHeight) < 21 && rect.screenY < 10)
      ) {
        if (
          Math.abs(element.offsetWidth / 2 + rect.screenX - client.width / 2) < 21 &&
          Math.abs(element.offsetHeight / 2 + rect.screenY - client.height / 2) < 21
        ) {
          return true
        } else {
          return false
        }
      } else {
        return false
      }
    },
    isAllFullClient(element) {
      const client = tool.getClient()
      const rect = tool.getRect(element)
      if (
        Math.abs(client.width - element.offsetWidth) < 21 &&
        rect.screenX < 20 &&
        Math.abs(client.height - element.offsetHeight) < 21 &&
        rect.screenY < 10
      ) {
        return true
      } else {
        return false
      }
    },
    getScroll() {
      return {
        left: document.documentElement.scrollLeft || document.body.scrollLeft,
        top: document.documentElement.scrollTop || document.body.scrollTop,
      }
    },
    getClient() {
      return {
        width: document.compatMode == "CSS1Compat" ? document.documentElement.clientWidth : document.body.clientWidth,
        height: document.compatMode == "CSS1Compat" ? document.documentElement.clientHeight : document.body.clientHeight,
      }
    },
    addStyle(css, id) {
      if (id) {
        const existing = document.querySelector('style[data-mam-style="' + id + '"]')
        if (existing) {
          existing.textContent = css
          return existing
        }
      }
      const style = document.createElement("style")
      style.type = "text/css"
      if (id) {
        style.setAttribute("data-mam-style", id)
      }
      const node = document.createTextNode(css)
      style.appendChild(node)
      document.head.appendChild(style)
      return style
    },
    matchRule(str, rule) {
      return new RegExp("^" + rule.split("*").join(".*") + "$").test(str)
    },
    createButton(id) {
      const btn = document.createElement("tbdiv")
      btn.id = id
      btn.onclick = () => {
        maximize.playerControl()
      }
      document.body.appendChild(btn)
      return btn
    },
    addTip(str) {
      let tip = document.getElementById("catTip")
      if (!tip) {
        tip = document.createElement("tbdiv")
        tip.id = "catTip"
        document.body.appendChild(tip)
      }
      // Coalescing queue: a tip fired while one is showing replaces the text
      // and resets the timer chain instead of being silently dropped.
      tip.textContent = str
      clearTimeout(gv.tipTimers.show)
      clearTimeout(gv.tipTimers.hide)
      clearTimeout(gv.tipTimers.remove)
      tip.style.right = -tip.offsetWidth - 5 + "px"
      tip.style.display = "block"
      gv.tipTimers.show = setTimeout(() => {
        tip.style.right = "25px"
      }, 300)
      gv.tipTimers.hide = setTimeout(() => {
        tip.style.right = -tip.offsetWidth - 5 + "px"
      }, 3800)
      // Hard-fallback removal: transition events stall in backgrounded tabs,
      // timers eventually fire — the element is always reclaimed.
      gv.tipTimers.remove = setTimeout(() => {
        if (tip && tip.parentNode) {
          tip.parentNode.removeChild(tip)
        }
      }, 4800)
    },
    findVideoIn(scope) {
      if (!scope) {
        return null
      }
      if (scope.nodeName == "VIDEO") {
        return scope
      }
      let video = null
      try {
        video = scope.querySelector ? scope.querySelector("video") : null
      } catch (e) {
        tool.print("findVideoIn query failed: " + e.message)
      }
      if (!video && scope.shadowRoot) {
        try {
          video = scope.shadowRoot.querySelector("video")
        } catch (e) {
          tool.print("findVideoIn shadow query failed: " + e.message)
        }
      }
      return video
    },
    isTypingContext(target) {
      if (!target || !target.nodeName) {
        return false
      }
      const name = target.nodeName
      return name == "INPUT" || name == "TEXTAREA" || name == "SELECT" || target.isContentEditable === true
    },
    isTrustedSource(source) {
      if (!source) {
        return false
      }
      if (source === window || source === window.parent) {
        return true
      }
      for (const frame of document.querySelectorAll("iframe")) {
        if (frame.contentWindow === source) {
          return true
        }
      }
      return false
    },
    clamp(value, min, max) {
      return Math.min(max, Math.max(min, value))
    },
  }

  // Ψ image PiP — canvas/captureStream engine that renders a still image (or an
  // animated GIF frame-by-frame) into a muted hidden video so the browser PiP
  // window can host it. Every allocated resource is reclaimed on stop (D4).
  const imagePip = {
    active: null,
    async start(img) {
      if (!document.pictureInPictureEnabled) {
        tool.addTip(gv.btnText.pipUnsupported)
        return
      }
      if (document.pictureInPictureElement) {
        try {
          await document.exitPictureInPicture()
        } catch (e) {
          tool.print("imagePip exit failed: " + e.message)
        }
        return
      }
      if (this.active) {
        await this.stop()
      }
      const width = img.naturalWidth || img.width
      const height = img.naturalHeight || img.height
      if (!width || !height) {
        tool.addTip(gv.btnText.pipUnsupported)
        return
      }
      const canvas = document.createElement("canvas")
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext("2d")
      const video = document.createElement("video")
      video.muted = true
      video.setAttribute("data-mam-pip", "image")
      // Kept in the document (1px, transparent) because some engines refuse
      // requestPictureInPicture on fully detached video elements.
      video.style.cssText = "position:fixed;left:-10px;top:-10px;width:1px;height:1px;opacity:0;pointer-events:none;z-index:-1;"
      // Continuous redraw keeps frames flowing through the captured stream
      // (a static canvas alone can render as black in the PiP window) and it
      // animates GIFs as a bonus. Bounded: cleared unconditionally in stop().
      const drawTimer = setInterval(() => {
        try {
          ctx.drawImage(img, 0, 0, width, height)
        } catch (e) {
          tool.print("imagePip redraw failed: " + e.message)
        }
      }, 250)
      const state = { canvas, ctx, video, stream: null, drawTimer, img }
      this.active = state
      video.addEventListener("leavepictureinpicture", () => {
        imagePip.stop()
      })
      try {
        ctx.drawImage(img, 0, 0, width, height)
        state.stream = canvas.captureStream(10)
        video.srcObject = state.stream
        document.body.appendChild(video)
        await video.play()
        await video.requestPictureInPicture()
        tool.print("imagePip active (" + width + "x" + height + ")")
      } catch (error) {
        tool.print("imagePip failed: " + error.message)
        if (error && error.name === "SecurityError") {
          tool.addTip(gv.btnText.pipCors)
        } else {
          tool.addTip(gv.btnText.pipUnsupported)
        }
        await this.stop()
      }
    },
    async stop() {
      const state = this.active
      if (!state) {
        return
      }
      this.active = null
      clearInterval(state.drawTimer)
      try {
        state.video.pause()
      } catch (e) {
        tool.print("imagePip pause failed: " + e.message)
      }
      try {
        if (state.stream) {
          state.stream.getTracks().forEach((track) => track.stop())
        }
      } catch (e) {
        tool.print("imagePip track stop failed: " + e.message)
      }
      try {
        state.video.srcObject = null
      } catch (e) {
        tool.print("imagePip detach failed: " + e.message)
      }
      if (state.video.parentNode) {
        state.video.parentNode.removeChild(state.video)
      }
      tool.print("imagePip stopped")
    },
  }

  const setButton = {
    init() {
      if (!document.getElementById("playerControlBtn")) {
        init()
      }
      if (gv.isIframe && tool.isHalfFullClient(gv.player)) {
        window.parent.postMessage("iframeVideo", "*")
        return
      }
      this.show()
    },
    show() {
      gv.player.removeEventListener("mouseleave", handle.leavePlayer, false)
      gv.player.addEventListener("mouseleave", handle.leavePlayer, false)

      if (!gv.isFull) {
        document.removeEventListener("scroll", handle.scrollFix, false)
        document.addEventListener("scroll", handle.scrollFix, false)
      }
      gv.controlBtn.style.display = "block"
      gv.controlBtn.style.visibility = "visible"
      const pipAvailable =
        document.pictureInPictureEnabled &&
        gv.player.nodeName != "OBJECT" &&
        gv.player.nodeName != "EMBED" &&
        (gv.player.nodeName != "IMG" || settings.get("imagePip"))
      if (pipAvailable) {
        gv.picinpicBtn.style.display = "block"
        gv.picinpicBtn.style.visibility = "visible"
      }
      this.locate()
    },
    locate() {
      const playerRect = tool.getRect(gv.player)
      const client = tool.getClient()
      // Buttons clamp into the viewport so the controls stay reachable when a
      // player sits at the very top or right edge of the window.
      const top = tool.clamp(playerRect.screenY - 20, 2, Math.max(2, client.height - 24))
      const left = tool.clamp(playerRect.screenX - 64 + gv.player.offsetWidth, 2, Math.max(2, client.width - 66))
      const pipLeft = Math.max(2, left - 54)
      gv.controlBtn.style.opacity = settings.get("buttonOpacity")
      gv.controlBtn.textContent = gv.btnText.max
      gv.controlBtn.style.top = top + "px"
      // Position of Maximize button
      gv.controlBtn.style.left = left + "px"
      gv.picinpicBtn.style.opacity = settings.get("buttonOpacity")
      gv.picinpicBtn.textContent = gv.btnText.pip
      gv.picinpicBtn.style.top = top + "px"
      // Position of PIP button
      gv.picinpicBtn.style.left = pipLeft + "px"
    },
  }

  const handle = {
    getPlayer(e) {
      if (gv.isFull) {
        return
      }
      gv.mouseoverEl = e.target
      const path = e.path || e.composedPath()
      const hostname = document.location.hostname
      let players = []
      for (let i in html5Rules) {
        if (tool.matchRule(hostname, i)) {
          for (let html5Rule of html5Rules[i]) {
            if (document.querySelectorAll(html5Rule).length > 0) {
              for (let player of document.querySelectorAll(html5Rule)) {
                players.push(player)
              }
            }
          }
          break
        }
      }
      if (players.length == 0) {
        for (let generalPlayerRule of generalPlayerRules) {
          if (document.querySelectorAll(generalPlayerRule).length > 0) {
            for (let player of document.querySelectorAll(generalPlayerRule)) {
              players.push(player)
            }
          }
        }
      }
      if (players.length == 0 && e.target.nodeName != "VIDEO" && document.querySelectorAll("video").length > 0) {
        const videos = document.querySelectorAll("video")
        for (let v of videos) {
          const vRect = v.getBoundingClientRect()
          if (
            e.clientX >= vRect.x - 2 &&
            e.clientX <= vRect.x + vRect.width + 2 &&
            e.clientY >= vRect.y - 2 &&
            e.clientY <= vRect.y + vRect.height + 2 &&
            v.offsetWidth > settings.get("minMediaWidth") &&
            v.offsetHeight > settings.get("minMediaHeight")
          ) {
            players = []
            players[0] = handle.autoCheck(v)
            gv.autoCheckCount = 1
            break
          }
        }
      }
      // Shadow-aware fallback: the composed event path pierces open shadow
      // roots, so media invisible to every selector grammar above can still
      // be discovered by walking the nodes the pointer actually crossed.
      if (players.length == 0 && settings.get("shadowScan") && path) {
        for (let node of path) {
          if (node && MEDIA_TAGS.indexOf(node.nodeName) > -1) {
            const imageAllowed = node.nodeName != "IMG" || settings.get("imageMaximize")
            if (
              imageAllowed &&
              node.offsetWidth > settings.get("minMediaWidth") &&
              node.offsetHeight > settings.get("minMediaHeight")
            ) {
              players = [node]
              break
            }
          }
        }
      }
      if (players.length > 0 && path) {
        for (let v of players) {
          if (path.indexOf(v) > -1) {
            gv.player = v
            setButton.init()
            return
          }
        }
      }
      switch (e.target.nodeName) {
        case "VIDEO":
        case "OBJECT":
        case "EMBED":
          if (e.target.offsetWidth > settings.get("minMediaWidth") && e.target.offsetHeight > settings.get("minMediaHeight")) {
            gv.player = e.target
            setButton.init()
          }
          break
        case "IMG":
          if (
            settings.get("imageMaximize") &&
            e.target.offsetWidth > settings.get("minMediaWidth") &&
            e.target.offsetHeight > settings.get("minMediaHeight")
          ) {
            gv.player = e.target
            setButton.init()
          }
          break
        default:
          handle.leavePlayer()
      }
    },
    autoCheck(v) {
      let tempPlayer,
        el = v
      gv.playerChilds = []
      gv.playerChilds.push(v)
      while ((el = el.parentNode)) {
        if (Math.abs(v.offsetWidth - el.offsetWidth) < 15 && Math.abs(v.offsetHeight - el.offsetHeight) < 15) {
          tempPlayer = el
          gv.playerChilds.push(el)
        } else {
          break
        }
      }
      return tempPlayer
    },
    leavePlayer() {
      if (gv.controlBtn && gv.controlBtn.style.visibility == "visible") {
        gv.controlBtn.style.opacity = ""
        gv.controlBtn.style.visibility = ""
        if (gv.picinpicBtn) {
          gv.picinpicBtn.style.opacity = ""
          gv.picinpicBtn.style.visibility = ""
        }
        if (gv.player) {
          gv.player.removeEventListener("mouseleave", handle.leavePlayer, false)
        }
        document.removeEventListener("scroll", handle.scrollFix, false)
      }
    },
    scrollFix(e) {
      clearTimeout(gv.scrollFixTimer)
      gv.scrollFixTimer = setTimeout(() => {
        setButton.locate()
      }, 20)
    },
    hotKey(e) {
      if (!settings.get("hotkeys")) {
        return
      }
      const key = typeof e.key === "string" ? e.key : ""
      // Ψ console toggle — Alt+S stays outside the typing guard so the console
      // can always be summoned, even while focused inside an input field.
      if (e.altKey && (key == "s" || key == "S" || e.keyCode == 83)) {
        e.preventDefault()
        mamConsole.toggle()
        return
      }
      if (tool.isTypingContext(e.target)) {
        return
      }
      // Default is ESC. Search "keycode" and enter your own value with number corresponding to key to change.
      if (key == "Escape" || e.keyCode == 27) {
        if (mamConsole.isOpen()) {
          mamConsole.toggle(false)
          return
        }
        // Let ESC exit a NATIVE fullscreen element first; toggling web-maximize
        // at the same instant would wedge both states together.
        if (document.fullscreenElement || document.webkitFullscreenElement) {
          return
        }
        maximize.playerControl()
      }
      // Default shortcode for PIP is F2.
      if (key == "F2" || e.keyCode == 113) {
        if (mamConsole.isOpen()) {
          return
        }
        handle.pictureInPicture()
      }
    },
    async receiveMessage(e) {
      if (!tool.isTrustedSource(e.source)) {
        return
      }
      if (typeof e.data !== "string") {
        return
      }
      switch (e.data) {
        case "iframePicInPic":
          tool.print("messege:iframePicInPic")
          try {
            if (!document.pictureInPictureElement) {
              const hovered = gv.mouseoverEl && gv.mouseoverEl.nodeName == "VIDEO" ? gv.mouseoverEl : null
              const video = hovered || tool.findVideoIn(gv.player) || document.querySelector("video")
              if (!video) {
                tool.addTip(gv.btnText.tip)
                break
              }
              await video.requestPictureInPicture()
            } else {
              await document.exitPictureInPicture()
            }
          } catch (error) {
            tool.print("pip error: " + error.message)
            tool.addTip(gv.btnText.tip)
          }
          break
        case "iframeVideo":
          tool.print("messege:iframeVideo")
          if (!gv.isFull) {
            gv.player = gv.mouseoverEl
            setButton.init()
          }
          break
        case "parentFull":
          tool.print("messege:parentFull")
          gv.player = gv.mouseoverEl
          if (gv.isIframe) {
            window.parent.postMessage("parentFull", "*")
          }
          maximize.checkParent()
          maximize.fullWin()
          if (gv.player && getComputedStyle(gv.player).left != "0px") {
            tool.addStyle("#htmlToothbrush #bodyToothbrush .playerToothbrush {left:0px !important;width:100vw !important;}", "mam-parentfull")
          }
          gv.isFull = true
          break
        case "parentSmall":
          tool.print("messege:parentSmall")
          if (gv.isIframe) {
            window.parent.postMessage("parentSmall", "*")
          }
          maximize.smallWin()
          break
        case "innerFull":
          tool.print("messege:innerFull")
          if (gv.player && gv.player.nodeName == "IFRAME") {
            gv.player.contentWindow.postMessage("innerFull", "*")
          }
          maximize.checkParent()
          maximize.fullWin()
          break
        case "innerSmall":
          tool.print("messege:innerSmall")
          if (gv.player && gv.player.nodeName == "IFRAME") {
            gv.player.contentWindow.postMessage("innerSmall", "*")
          }
          maximize.smallWin()
          break
      }
    },
    async pictureInPicture() {
      try {
        if (!document.pictureInPictureEnabled) {
          tool.addTip(gv.btnText.pipUnsupported)
          return
        }
        if (document.pictureInPictureElement) {
          await document.exitPictureInPicture()
          return
        }
        if (!gv.player) {
          const fallback = document.querySelector("video")
          if (fallback && !fallback.disablePictureInPicture) {
            await fallback.requestPictureInPicture()
          } else {
            tool.addTip(gv.btnText.tip)
          }
          return
        }
        if (gv.player.nodeName == "IFRAME") {
          gv.player.contentWindow.postMessage("iframePicInPic", "*")
          return
        }
        if (gv.player.nodeName == "IMG") {
          if (settings.get("imagePip")) {
            await imagePip.start(gv.player)
          } else {
            tool.addTip(gv.btnText.tip)
          }
          return
        }
        const video = tool.findVideoIn(gv.player) || document.querySelector("video")
        if (!video) {
          tool.addTip(gv.btnText.tip)
          return
        }
        if (video.disablePictureInPicture) {
          tool.addTip(gv.btnText.pipUnsupported)
          return
        }
        await video.requestPictureInPicture()
      } catch (error) {
        tool.print("pip error: " + error.message)
        tool.addTip(gv.btnText.pipUnsupported)
      }
    },
  }

  const maximize = {
    playerControl() {
      if (!gv.player) {
        return
      }
      this.checkParent()
      if (!gv.isFull) {
        if (gv.isIframe) {
          window.parent.postMessage("parentFull", "*")
        }
        if (gv.player.nodeName == "IFRAME") {
          gv.player.contentWindow.postMessage("innerFull", "*")
        }
        this.fullWin()
        if (gv.autoCheckCount > 0 && gv.playerChilds && gv.playerChilds[0] && !tool.isHalfFullClient(gv.playerChilds[0])) {
          if (gv.autoCheckCount > 10) {
            for (let v of gv.playerChilds) {
              v.classList.add("videoToothbrush")
            }
            return
          }
          const tempPlayer = handle.autoCheck(gv.playerChilds[0])
          gv.autoCheckCount++
          maximize.playerControl()
          gv.player = tempPlayer
          maximize.playerControl()
        } else {
          gv.autoCheckCount = 0
        }
      } else {
        if (gv.isIframe) {
          window.parent.postMessage("parentSmall", "*")
        }
        if (gv.player.nodeName == "IFRAME") {
          gv.player.contentWindow.postMessage("innerSmall", "*")
        }
        this.smallWin()
      }
    },
    checkParent() {
      if (gv.isFull) {
        return
      }
      gv.playerParents = []
      let full = gv.player
      while ((full = full.parentNode)) {
        if (full.nodeName == "BODY") {
          break
        }
        if (full.getAttribute) {
          gv.playerParents.push(full)
        }
      }
    },
    fullWin() {
      if (!gv.isFull) {
        document.removeEventListener("mouseover", handle.getPlayer, false)
        gv.backHtmlId = document.body.parentNode.id
        gv.backBodyId = document.body.id
        if (document.location.hostname == "www.youtube.com" && !document.querySelector("#player-theater-container #movie_player")) {
          // Theater-mode expansion click is null-guarded: a missing
          // ytp-size-button used to abort maximize in a broken half-state.
          const ytpSizeButton = document.querySelector("#movie_player .ytp-size-button")
          if (ytpSizeButton) {
            ytpSizeButton.click()
            gv.ytbStageChange = true
          }
        }
        gv.leftBtn.style.display = "block"
        gv.rightBtn.style.display = "block"
        gv.picinpicBtn.style.display = ""
        gv.controlBtn.style.display = ""
        this.addClass()
      }
      gv.isFull = true
    },
    addClass() {
      document.body.parentNode.id = "htmlToothbrush"
      document.body.id = "bodyToothbrush"
      for (let v of gv.playerParents) {
        v.classList.add("parentToothbrush")
        // Parent element with position: fixed causes stacking order issues
        if (getComputedStyle(v).position == "fixed") {
          v.classList.add("absoluteToothbrush")
        }
      }
      gv.player.classList.add("playerToothbrush")
      if (gv.player.nodeName == "VIDEO") {
        gv.backControls = gv.player.controls
        gv.player.controls = true
      }
      window.dispatchEvent(new Event("resize"))
    },
    smallWin() {
      document.body.parentNode.id = gv.backHtmlId
      document.body.id = gv.backBodyId
      for (let v of gv.playerParents) {
        v.classList.remove("parentToothbrush")
        v.classList.remove("absoluteToothbrush")
      }
      gv.player.classList.remove("playerToothbrush")
      if (document.location.hostname == "www.youtube.com" && gv.ytbStageChange && document.querySelector("#player-theater-container #movie_player")) {
        const ytpSizeButton = document.querySelector("#movie_player .ytp-size-button")
        if (ytpSizeButton) {
          ytpSizeButton.click()
          gv.ytbStageChange = false
        }
      }
      if (gv.player.nodeName == "VIDEO") {
        gv.player.controls = gv.backControls
      }
      // Restore hygiene: strip the >10-climb fallback class so no dead state
      // survives a maximize cycle (the scoped CSS already neutralizes it,
      // but the class itself must not linger).
      if (gv.playerChilds) {
        for (let v of gv.playerChilds) {
          v.classList.remove("videoToothbrush")
        }
      }
      gv.leftBtn.style.display = ""
      gv.rightBtn.style.display = ""
      gv.controlBtn.style.display = ""
      document.addEventListener("mouseover", handle.getPlayer, false)
      window.dispatchEvent(new Event("resize"))
      gv.isFull = false
    },
  }

  // Ψ control console — 3lectric-Glass settings surface: glass L2 window,
  // near-solid headerbar with Orbitron title, spec switch toggles, glass L3
  // inputs, destructive reset, headerbar drag with persisted position.
  const mamConsole = {
    el: null,
    isOpen() {
      return !!(this.el && document.getElementById("mamConsole"))
    },
    toggle(force) {
      const open = typeof force === "boolean" ? force : !this.isOpen()
      if (open) {
        this.build()
      } else {
        this.close()
      }
    },
    build() {
      if (this.isOpen()) {
        this.render()
        return
      }
      const el = document.createElement("div")
      el.id = "mamConsole"
      el.className = "mam-console"
      const t = gv.btnText
      const switchRow = (key, label) =>
        '<div class="mam-row"><span class="mam-label">' +
        label +
        '</span><label class="mam-switch"><input type="checkbox" data-mam-key="' +
        key +
        '"><span class="mam-slider"></span></label></div>'
      el.innerHTML = [
        '<div class="mam-header">',
        '  <div class="mam-title">Ψ</div>',
        '  <div><div class="mam-title-text">MAXIMIZE_ANY_MEDIA</div>',
        '    <div class="mam-subtitle">' + SCRIPT.name + " · v" + SCRIPT.version + " · " + SCRIPT.spec + "</div></div>",
        '  <div class="mam-close mam-btn" title="close">✕</div>',
        "</div>",
        '<div class="mam-body">',
        switchRow("hotkeys", t.cHotkeys),
        switchRow("imageMaximize", t.cImgMax),
        switchRow("imagePip", t.cImgPip),
        switchRow("shadowScan", t.cShadow),
        '  <div class="mam-row"><span class="mam-label">' + t.cMinW + '</span><input type="number" class="mam-num" data-mam-key="minMediaWidth" min="0" max="10000" step="1"></div>',
        '  <div class="mam-row"><span class="mam-label">' + t.cMinH + '</span><input type="number" class="mam-num" data-mam-key="minMediaHeight" min="0" max="10000" step="1"></div>',
        '  <div class="mam-row"><span class="mam-label">' + t.cOpacity + '</span><input type="range" class="mam-range" data-mam-key="buttonOpacity" min="0.3" max="1" step="0.05"></div>',
        '  <div class="mam-status" data-mam-status></div>',
        "</div>",
        '<div class="mam-footer">',
        '  <button class="mam-btn mam-destructive" data-mam-reset>' + t.cReset + "</button>",
        '  <button class="mam-btn" data-mam-done>' + t.cDone + "</button>",
        "</div>",
      ].join("\n")
      document.body.appendChild(el)
      this.el = el
      this.place(el)
      this.wire(el)
      this.render()
      tool.print("Ψ console open")
    },
    place(el) {
      const client = tool.getClient()
      const pos = settings.get("consolePos")
      const width = el.offsetWidth || 340
      let x = pos ? pos.x : Math.round((client.width - width) / 2)
      let y = pos ? pos.y : Math.round(client.height / 4)
      el.style.left = tool.clamp(x, 0, Math.max(0, client.width - width)) + "px"
      el.style.top = tool.clamp(y, 0, Math.max(0, client.height - 60)) + "px"
    },
    wire(el) {
      el.querySelectorAll("input[data-mam-key]").forEach((input) => {
        input.addEventListener("change", () => {
          if (input.type === "checkbox") {
            settings.save({ [input.dataset.mamKey]: input.checked })
          } else if (input.type === "range") {
            settings.save({ [input.dataset.mamKey]: parseFloat(input.value) })
          } else {
            const parsed = parseInt(input.value, 10)
            settings.save({ [input.dataset.mamKey]: isNaN(parsed) ? 0 : parsed })
          }
          this.render()
        })
      })
      const resetBtn = el.querySelector("[data-mam-reset]")
      if (resetBtn) {
        resetBtn.addEventListener("click", () => {
          settings.reset()
          this.place(el)
          this.render()
          tool.addTip("Ψ defaults restored")
        })
      }
      const doneBtn = el.querySelector("[data-mam-done]")
      if (doneBtn) {
        doneBtn.addEventListener("click", () => this.close())
      }
      const closeBtn = el.querySelector(".mam-close")
      if (closeBtn) {
        closeBtn.addEventListener("click", () => this.close())
      }
      const header = el.querySelector(".mam-header")
      if (header) {
        this.draggable(el, header)
      }
    },
    draggable(el, handleBar) {
      handleBar.addEventListener("pointerdown", (e) => {
        if (e.target.closest(".mam-close")) {
          return
        }
        const startX = e.clientX
        const startY = e.clientY
        const startLeft = el.offsetLeft
        const startTop = el.offsetTop
        handleBar.setPointerCapture(e.pointerId)
        const onMove = (ev) => {
          const client = tool.getClient()
          el.style.left = tool.clamp(startLeft + ev.clientX - startX, 0, Math.max(0, client.width - el.offsetWidth)) + "px"
          el.style.top = tool.clamp(startTop + ev.clientY - startY, 0, Math.max(0, client.height - 40)) + "px"
        }
        const onUp = () => {
          handleBar.removeEventListener("pointermove", onMove)
          handleBar.removeEventListener("pointerup", onUp)
          handleBar.removeEventListener("pointercancel", onUp)
          settings.save({ consolePos: { x: el.offsetLeft, y: el.offsetTop } })
        }
        handleBar.addEventListener("pointermove", onMove)
        handleBar.addEventListener("pointerup", onUp)
        handleBar.addEventListener("pointercancel", onUp)
      })
    },
    render() {
      const el = this.el
      if (!el) {
        return
      }
      el.querySelectorAll("input[data-mam-key]").forEach((input) => {
        const value = settings.get(input.dataset.mamKey)
        if (input.type === "checkbox") {
          input.checked = value === true
        } else {
          input.value = value
        }
      })
      const status = el.querySelector("[data-mam-status]")
      if (status) {
        let state = "no target"
        if (gv.player) {
          state = tool.isAllFullClient(gv.player) ? "all-full" : tool.isHalfFullClient(gv.player) ? "half-full" : "normal"
          state += " · " + String(gv.player.nodeName).toLowerCase()
        }
        status.textContent = gv.btnText.cStatus + ": " + state
      }
    },
    close() {
      if (this.el && this.el.parentNode) {
        this.el.parentNode.removeChild(this.el)
      }
      this.el = null
    },
  }

  const registerMenu = () => {
    if (typeof GM_registerMenuCommand === "function") {
      GM_registerMenuCommand("Ψ Maximize_Any_Media — console (Alt+S)", () => {
        mamConsole.toggle()
      })
    }
  }

  // 3lectric-Glass stylesheet — maximize-engine contracts preserved verbatim
  // from the baseline; control surfaces realigned to the spec palette.
  const MAM_CSS = [
    // --- maximize engine contracts (functional) ---
    "#htmlToothbrush #bodyToothbrush .parentToothbrush .bilibili-player-video {margin:0 !important;}",
    "#htmlToothbrush, #bodyToothbrush {overflow:hidden !important;zoom:100% !important;}",
    "#htmlToothbrush #bodyToothbrush .parentToothbrush {overflow:visible !important;z-index:auto !important;transform:none !important;-webkit-transform-style:flat !important;transition:none !important;contain:none !important;}",
    "#htmlToothbrush #bodyToothbrush .absoluteToothbrush {position:absolute !important;}",
    "#htmlToothbrush #bodyToothbrush .playerToothbrush {position:fixed !important;top:0px !important;left:0px !important;width:100vw !important;height:100vh !important;max-width:none !important;max-height:none !important;min-width:0 !important;min-height:0 !important;margin:0 !important;padding:0 !important;z-index:2147483646 !important;border:none !important;background-color:#000 !important;transform:none !important;}",
    "#htmlToothbrush #bodyToothbrush .parentToothbrush video {object-fit:contain !important;}",
    "#htmlToothbrush #bodyToothbrush .parentToothbrush img {object-fit:contain !important;}",
    "#htmlToothbrush #bodyToothbrush .parentToothbrush .videoToothbrush {width:100vw !important;height:100vh !important;}",
    // --- glass control surfaces (JetBrains Mono, cyan, 0px radius, 150ms) ---
    '#playerControlBtn, #picinpicBtn {text-shadow:none;visibility:hidden;opacity:0;display:none;transition:all 150ms ease-in-out;cursor:pointer;font:12px "JetBrains Mono", monospace;margin:0;width:64px;height:20px;line-height:20px;border:1px solid rgba(0,229,255,0.4);text-align:center;position:fixed;z-index:2147483647;background-color:rgba(10,19,26,0.65);color:#00E5FF;border-radius:0px;box-shadow:0 0 12px rgba(0,229,255,0.15);}',
    "#picinpicBtn {width:53px;}",
    "#playerControlBtn:hover, #picinpicBtn:hover {visibility:visible;opacity:1;background-color:rgba(0,229,255,0.2);border-color:#00E5FF;box-shadow:0 0 20px rgba(0,229,255,0.5);color:#67E8F9;}",
    "#leftFullStackButton{display:none;position:fixed;width:1px;height:100vh;top:0;left:0;z-index:2147483647;background:#000;}",
    "#rightFullStackButton{display:none;position:fixed;width:1px;height:100vh;top:0;right:0;z-index:2147483647;background:#000;}",
    // --- notification tip (glass L2 + notification-label tokens) ---
    '#catTip {transition:all 150ms ease-in-out;background:rgba(10,19,26,0.65);border:1px solid rgba(0,229,255,0.3);box-shadow:0 0 20px rgba(0,229,255,0.15);color:#FFFFFF;font-weight:bold;font:12px "JetBrains Mono", monospace;margin-left:-250px;overflow:hidden;padding:10px;position:fixed;text-align:center;bottom:100px;z-index:2147483647;}',
    // --- Ψ console (glass L2 window, near-solid headerbar, spec switches) ---
    '#mamConsole {position:fixed;z-index:2147483647;background:rgba(10,19,26,0.65);border:1px solid rgba(0,229,255,0.3);box-shadow:0 0 40px rgba(0,229,255,0.15);color:#00E5FF;font:12px "JetBrains Mono", monospace;min-width:320px;max-width:400px;border-radius:0px;}',
    '#mamConsole .mam-header {background:rgba(10,19,26,0.95);border-bottom:2px solid #00E5FF;padding:10px;cursor:move;display:flex;align-items:center;gap:10px;user-select:none;-webkit-user-select:none;}',
    '#mamConsole .mam-title {font-family:"Orbitron", sans-serif;font-size:20pt;font-weight:700;color:#67E8F9;line-height:1;}',
    '#mamConsole .mam-title-text {font-family:"Orbitron", sans-serif;font-size:14pt;font-weight:700;color:#67E8F9;}',
    '#mamConsole .mam-subtitle {font:9pt "JetBrains Mono", monospace;color:rgba(0,229,255,0.7);}',
    "#mamConsole .mam-close {margin-left:auto;padding:2px 8px;}",
    "#mamConsole .mam-body {padding:10px;}",
    "#mamConsole .mam-row {display:flex;align-items:center;justify-content:space-between;padding:5px 0;gap:10px;}",
    "#mamConsole .mam-label {color:#00E5FF;}",
    "#mamConsole .mam-switch {position:relative;width:40px;height:20px;flex:none;}",
    "#mamConsole .mam-switch input {opacity:0;width:0;height:0;position:absolute;}",
    "#mamConsole .mam-switch .mam-slider {position:absolute;top:0;left:0;right:0;bottom:0;background:#050A0F;border:1px solid #00E5FF;transition:all 150ms ease-in-out;}",
    '#mamConsole .mam-switch .mam-slider::before {content:"";position:absolute;width:12px;height:12px;left:3px;top:3px;background:#00E5FF;box-shadow:0 0 12px rgba(0,229,255,0.8);transition:all 150ms ease-in-out;}',
    "#mamConsole .mam-switch input:checked + .mam-slider {background:rgba(0,229,255,0.2);}",
    "#mamConsole .mam-switch input:checked + .mam-slider::before {transform:translateX(20px);}",
    '#mamConsole input[type="number"], #mamConsole input[type="range"] {background:rgba(10,19,26,0.55);border:1px solid rgba(0,229,255,0.4);color:#00E5FF;font:12px "JetBrains Mono", monospace;border-radius:0px;padding:3px 5px;}',
    "#mamConsole .mam-num {width:80px;}",
    "#mamConsole .mam-range {width:120px;}",
    "#mamConsole .mam-status {color:rgba(0,229,255,0.7);font-size:10px;padding-top:8px;border-top:1px solid rgba(0,229,255,0.2);margin-top:8px;}",
    "#mamConsole .mam-footer {display:flex;justify-content:space-between;gap:10px;padding:10px;border-top:1px solid rgba(0,229,255,0.2);}",
    '#mamConsole .mam-btn {background:rgba(10,19,26,0.65);border:1px solid rgba(0,229,255,0.4);color:#00E5FF;border-radius:0px;padding:6px 14px;font-weight:bold;cursor:pointer;transition:all 150ms ease-in-out;font:12px "JetBrains Mono", monospace;}',
    "#mamConsole .mam-btn:hover {background:rgba(0,229,255,0.2);border-color:#00E5FF;box-shadow:0 0 20px rgba(0,229,255,0.5);color:#67E8F9;}",
    "#mamConsole .mam-btn:active {background:rgba(0,229,255,0.3);color:#FFFFFF;}",
    "#mamConsole .mam-btn.mam-destructive {border-color:#ff0055;color:#ff0055;}",
    "#mamConsole .mam-btn.mam-destructive:hover {background:rgba(255,0,85,0.3);box-shadow:0 0 25px #ff0055;color:#FFFFFF;}",
  ].join("\n")

  const init = () => {
    const firstBoot = !gv.booted
    if (firstBoot) {
      gv.booted = true
      settings.load()
    }
    // Idempotent button creation — self-heals after SPA body wipes. Style and
    // document-level listeners are boot-once only, so re-entry never stacks
    // duplicate <style> elements or event handlers.
    if (!document.getElementById("picinpicBtn")) {
      gv.picinpicBtn = document.createElement("tbdiv")
      gv.picinpicBtn.id = "picinpicBtn"
      gv.picinpicBtn.onclick = () => {
        handle.pictureInPicture()
      }
      document.body.appendChild(gv.picinpicBtn)
    } else {
      gv.picinpicBtn = document.getElementById("picinpicBtn")
    }
    if (!document.getElementById("playerControlBtn")) {
      gv.controlBtn = tool.createButton("playerControlBtn")
    } else {
      gv.controlBtn = document.getElementById("playerControlBtn")
    }
    if (!document.getElementById("leftFullStackButton")) {
      gv.leftBtn = tool.createButton("leftFullStackButton")
    } else {
      gv.leftBtn = document.getElementById("leftFullStackButton")
    }
    if (!document.getElementById("rightFullStackButton")) {
      gv.rightBtn = tool.createButton("rightFullStackButton")
    } else {
      gv.rightBtn = document.getElementById("rightFullStackButton")
    }
    if (firstBoot) {
      if (getComputedStyle(gv.controlBtn).position != "fixed") {
        tool.addStyle(MAM_CSS, "mam-main")
      }
      document.addEventListener("mouseover", handle.getPlayer, false)
      document.addEventListener("keydown", handle.hotKey, false)
      window.addEventListener("message", handle.receiveMessage, false)
      registerMenu()
      tool.print(SCRIPT.name + " v" + SCRIPT.version + " · " + SCRIPT.spec + " · Ψ superset engine online")
      tool.print("Ready")
    }
  }

  init()
})()
