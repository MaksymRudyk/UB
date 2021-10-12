// initial sources https://github.com/e-anka/vue-anka-cropper
// removed axios and core-js dependency
<template>
  <div class="u-crop">
      <input
        v-show="false"
        ref="fileInput"
        type="hidden"
        class="u-crop__fileInput"
        @change="selectFile"
      >
      <div
        v-if="file"
        class="u-crop__mainArea"
      >
        <div :style="{width: cropperWidth + 'px', height: cropperHeight + 'px', float: 'left'}">
          <canvas
            ref="canvas"
            :width="canvasWidth"
            :height="canvasHeight"
            style="background: #ccc;"
            @mousemove="moveMouse"
            @mousedown="startDrag"
            @mouseup="stopDrag"
            @mouseleave="dragged = false"
          />
        </div>
        <div
          v-if="opts.showPreview"
          class="u-crop__previewArea"
          :style="{width: prevdivWidth + 'px', height: prevdivHeight + 'px', float: 'left'}"
        >
          <img
            :src="previewImage"
            :style="{width: previewSize.w + 'px', height: previewSize.h + 'px', borderRadius: opts.cropArea === 'circle' ? '50%' : 0}"
            alt=""
          >
        </div>
      </div>
      <div
        v-if="file && !remoteNavBar"
        class="u-crop__navigation"
      >
        <u-button
          @click="rotate(-90)"
          :title="$ut('rotate counter clock-wise')"
          icon="fas fa-undo"
          appearance="inverse"
        >
        </u-button>
        <u-button
          @click="rotate(90)"
          :title="$ut('rotate clock-wise')"
          icon="fas fa-redo"
          appearance="inverse"
        >
        </u-button>
        <u-button
          @click.prevent="flip('h')"
          :title="$ut('flip horizontally')"
          icon="fas fa-text-width"
          appearance="inverse"
        >
        </u-button>
        <u-button
          @click.prevent="flip('v')"
          :title="$ut('flip vertically')"
          icon="fas fa-text-height"
          appearance="inverse"
        >
        </u-button>
        <u-button
          color="primary"
          class="u-crop__rightButton"
          @click="doCrop"
        >
          {{ $ut("apply") }}
        </u-button>
        <u-button
          class="u-crop__rightButton"
          appearance="plain"
          @click="cancelCrop"
        >
          {{ $ut("Cancel") }}
        </u-button>
      </div>
    </div>
</template>
<script>
// import axios from 'axios'
export default {
  name: 'UCrop',
  props: {
    options: {
      type: Object,
      default () {
        return {}
      }
    },
    imgSrc: {
      type: String,
      default: ''
    },
    firstCropFullImage: {
      type: Boolean,
      default: false
    },
    remoteNavBar: {
      type: Boolean,
      default: false
    }
  },
  data () {
    return {
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif'],
      canvas: false,
      ctx: false,
      defaultOptions: {
        aspectRatio: false, // false or number, always width / height, locks aspect ratio of cropper. It should equal to croppedWidth / croppedHeight
        closeOnSave: true,
        cropArea: 'box', // box or circle for round selections. If circle, aspect ratio will be locked to 1
        croppedHeight: false, // desired height of cropped image (or false)
        croppedWidth: false, // desired width of cropped image (or false)
        cropperHeight: false,
        frameLineDash: [5, 3], // dash pattern of the dashed line of the cropping frame
        frameStrokeColor: 'rgba(255, 255, 255, 0.8)', // main color of the stroke of the cropping frame
        handleFillColor: 'rgba(255, 255, 255, 0.2)',
        handleHoverFillColor: 'rgba(255, 255, 255, 0.4)',
        handleHoverStrokeColor: 'rgba(255, 255, 255, 1)',
        handleSize: 8, // size of the dragging handle in cropper
        handleStrokeColor: 'rgba(255, 255, 255, 0.8)',
        layoutBreakpoint: 850,
        maxCropperHeight: 768,
        maxFileSize: 10000000, // 10MB
        overlayFill: 'rgba(0, 0, 0, 0.5)', // fill of the masking overlay
        previewOnDrag: true,
        previewQuality: 0.65,
        resultQuality: 0.9,
        resultMimeType: 'image/png',
        showPreview: false,
        uploadData: {}, // additional upload data, such as user id or whatever
        uploadTo: false
      },
      dragged: false,
      fullWidth: 500, // width of whole ui
      file: false,
      fliph: false,
      flipv: false,
      h: 100,
      image: false,
      imageWidth: 0,
      imageHeight: 0,
      loadingImage: false,
      minW: 8, // minimum dimensions of the cropping window
      minH: 8, // minimum dimensions of the cropping window
      mx: 0,
      my: 0,
      over: false,
      previewImage: false,
      rotation: 0,
      w: 100,
      x: 20,
      y: 20
    }
  },
  computed: {
    canvasHeight () {
      if (this.imageRatio <= this.cropperRatio) { return this.cropperHeight }
      return Math.round(this.cropperWidth / this.imageRatio)
    },
    canvasWidth () {
      if (this.imageRatio >= this.cropperRatio) { return this.cropperWidth }
      return Math.round(this.imageRatio * this.canvasHeight)
    },
    cropData () {
      const scale = Math.round((this.imageWidth / this.canvasWidth + this.imageHeight / this.canvasHeight) / 0.002) / 1000
      const [rot, fh, fv] = [this.rotation, this.fliph, this.flipv]
      const x = this.x * scale
      const y = this.y * scale
      const w = this.w * scale
      const h = this.h * scale
      const a = this.imageWidth - x - w
      const b = this.imageHeight - y - h
      let nx, ny, nw, nh
      if ((rot === 0 && !fh && !fv) || (rot === 180 && fh && fv)) {
        nx = x
        ny = y
      }
      if ((rot === 90 && !fh && !fv) || (rot === 270 && fh && fv)) {
        nx = y
        ny = a
      }
      if ((rot === 180 && !fh && !fv) || (rot === 0 && fh && fv)) {
        nx = a
        ny = b
      }
      if ((rot === 270 && !fh && !fv) || (rot === 90 && fh && fv)) {
        nx = b
        ny = x
      }
      if ((rot === 0 && fh && !fv) || (rot === 180 && !fh && fv)) {
        nx = a
        ny = y
      }
      if ((rot === 90 && fh && !fv) || (rot === 270 && !fh && fv)) {
        nx = y
        ny = x
      }
      if ((rot === 180 && fh && !fv) || (rot === 0 && !fh && fv)) {
        nx = x
        ny = b
      }
      if ((rot === 270 && fh && !fv) || (rot === 90 && !fh && fv)) {
        nx = b
        ny = a
      }
      if (rot === 0 || rot === 180) {
        nw = w
        nh = h
      } else {
        nw = h
        nh = w
      }
      return { x: nx, y: ny, w: nw, h: nh }
    },
    cropperHeight () {
      if (this.opts.cropperHeight && this.fullWidth > this.opts.layoutBreakpoint) { return this.opts.cropperHeight - 80 }
      const calculatedHeight = Math.floor(this.cropperWidth / this.imageRatio)
      const maxHeight = this.opts.maxCropperHeight
      if (maxHeight && maxHeight > 100 && maxHeight < calculatedHeight) { return maxHeight - 80 }
      return calculatedHeight
    },
    cropperRatio () {
      return Math.round((this.cropperWidth / this.cropperHeight) * 1000) / 1000
    },
    cropperWidth () {
      const mw = this.fullWidth - 24
      if (this.fullWidth <= this.opts.layoutBreakpoint || !this.opts.showPreview) return mw
      return Math.floor(0.65 * mw)
    },
    cx () {
      const box = this.canvas.getBoundingClientRect()
      return this.mx - box.left
    },
    cy () {
      const box = this.canvas.getBoundingClientRect()
      return this.my - box.top
    },
    imageRatio () {
      if (!this.imageHeight) return 0
      return Math.round((this.imageWidth / this.imageHeight) * 1000) / 1000
    },
    markers () {
      return {
        nw: { x: this.x - this.opts.handleSize, y: this.y - this.opts.handleSize },
        ne: { x: this.x + this.w - this.opts.handleSize, y: this.y - this.opts.handleSize },
        sw: { x: this.x - this.opts.handleSize, y: this.y + this.h - this.opts.handleSize },
        se: { x: this.x + this.w - this.opts.handleSize, y: this.y + this.h - this.opts.handleSize }
      }
    },
    opts () {
      const opts = Object.assign({}, this.defaultOptions, this.options)
      if (opts.cropArea === 'circle') opts.aspectRatio = 1
      return opts
    },
    prevdivHeight () {
      if (this.fullWidth > this.opts.layoutBreakpoint) return this.cropperHeight
      return 300
    },
    prevdivWidth () {
      const mw = this.fullWidth - 24
      if (this.fullWidth <= this.opts.layoutBreakpoint) return mw
      return Math.floor(0.35 * mw)
    },
    previewCanvas () {
      if (!this.image || !this.resultCanvas) { return false }
      const canvas = document.createElement('canvas')
      canvas.width = this.previewSize.w
      canvas.height = this.previewSize.h
      const ctx = canvas.getContext('2d')
      ctx.drawImage(this.resultCanvas, 0, 0, canvas.width, canvas.height)
      return canvas
    },
    previewSize () {
      const [dw, dh] = [this.prevdivWidth - 20, this.prevdivHeight - 20]
      const pdratio = Math.round((dw / dh) * 1000) / 1000
      const resratio = Math.round((this.resultWidth / this.resultHeight) * 1000) / 1000
      let pw, ph
      if (resratio > pdratio) {
        pw = dw
        ph = dw / resratio
      } else {
        ph = dh
        pw = ph * resratio
      }
      return { w: Math.min(pw, this.resultWidth), h: Math.min(ph, this.resultHeight) }
    },
    resultCanvas () {
      if (!this.image) { return false }
      const canvas = document.createElement('canvas')
      canvas.width = this.resultWidth
      canvas.height = this.resultHeight
      const ctx = canvas.getContext('2d')
      ctx.save()
      if (this.fliph) {
        ctx.translate(this.resultWidth, 0)
        ctx.scale(-1, 1)
      }
      if (this.flipv) {
        ctx.translate(0, this.resultHeight)
        ctx.scale(1, -1)
      }
      const rotated = this.rotation === 90 || this.rotation === 270
      const w = rotated ? canvas.height : canvas.width
      const h = rotated ? canvas.width : canvas.height
      ctx.translate(canvas.width / 2, canvas.height / 2)
      ctx.rotate(this.rotation * Math.PI / 180)
      ctx.drawImage(
        this.image,
        this.cropData.x,
        this.cropData.y,
        this.cropData.w,
        this.cropData.h,
        -w / 2,
        -h / 2,
        w,
        h)
      ctx.restore()
      return canvas
    },
    resultWidth () {
      const [ar, cw, ch] = [this.opts.aspectRatio, this.opts.croppedWidth, this.opts.croppedHeight]
      const imageFactor = Math.round((this.imageWidth / this.canvasWidth) * 1000) / 1000
      const ratio = ar || this.w / this.h
      if (cw && !ch) { return cw }
      if (!cw && !ch) { return Math.round(this.w * imageFactor) }
      if (!cw && ch) { return Math.round(ch * ratio) }
      const resultRatio = cw / ch
      if (ratio >= resultRatio) { return cw }
      return Math.round(ch * ratio)
    },
    resultHeight () {
      const [ar, cw, ch] = [this.opts.aspectRatio, this.opts.croppedWidth, this.opts.croppedHeight]
      const imageFactor = Math.round((this.imageHeight / this.canvasHeight) * 1000) / 1000
      const ratio = ar || this.w / this.h
      if (ch && !cw) { return ch }
      if (!cw && !ch) { return Math.round(this.h * imageFactor) }
      if (!ch && cw) { return Math.round(cw / ratio) }
      const resultRatio = cw / ch
      if (ratio <= resultRatio) { return ch }
      return Math.round(cw / ratio)
    }
  },
  watch: {
    file (nf) {
      this.rotation = 0
      this.fliph = false
      this.flipv = false
      const reader = new FileReader()
      reader.onload = (evt) => {
        const img = new Image()
        img.onload = () => {
          this.imageWidth = img.width
          this.imageHeight = img.height
          this.image = img
          this.loadingImage = false
          this.$nextTick(this.startCanvas)
        }
        img.onerror = (error) => {
          this.loadingImage = false
          this.imageWidth = 0
          this.imageHeight = 0
          this.image = false
          this.file = false
          this.$emit('cropper-error', 'Image reading error' + error)
        }
        const input = this.$refs.fileInput
        input.val = ''
        img.src = evt.target.result
      }
      reader.onerror = (error) => {
        this.file = false
        this.$emit('cropper-error', 'File reading error' + error)
      }
      if (nf) {
        reader.readAsDataURL(this.file)
      } else {
        this.imageWidth = 0
        this.imageHeight = 0
        this.image = false
      }
    }
  },
  mounted () {
    this.file = this.dataURItoFile(this.imgSrc)
    this.getFullWidth()
    this.$emit('cropper-mounted')
    window.addEventListener('resize', this.getFullWidth)
  },
  beforeDestroy () {
    this.$emit('cropper-before-destroy')
    window.removeEventListener('resize', this.getFullWidth)
  },
  methods: {
    setFullWidth: function (width) {
      this.fullWidth = width
      this.$nextTick(this.drawCanvas)
    },
    // Converts a data URI string into a File object.
    dataURItoFile: function (dataURI) {
      const BASE64_MARKER = ';base64,'
      // if(!AttachmentUtils.isDataURI(dataURI)) { return false; }

      // Format of a base64-encoded URL:
      // data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAYAAAAEOCAIAAAAPH1dAAAAK
      const mime = dataURI.split(BASE64_MARKER)[0].split(':')[1]
      const filename = 'dataURI-file-' + (new Date()).getTime() + '.' + mime.split('/')[1]
      const bytes = atob(dataURI.split(BASE64_MARKER)[1])
      const writer = new Uint8Array(new ArrayBuffer(bytes.length))

      for (let i = 0; i < bytes.length; i++) {
        writer[i] = bytes.charCodeAt(i)
      }

      return new File([writer.buffer], filename, { type: mime })
    },
    cancelCrop () {
      const input = this.$refs.fileInput
      input.type = ''
      input.type = 'file'
      this.file = false
      this.$emit('cropper-cancelled')
    },
    doCrop () {
      const resultImage = this.resultCanvas.toDataURL(this.opts.resultMimeType, this.opts.resultQuality)
      const n = this.file.name.lastIndexOf('.')
      const fname = this.file.name.substring(0, n)
      const finalData = {
        originalFile: this.file,
        filename: fname,
        rotation: this.rotation,
        cropCoords: this.cropData,
        flippedH: this.fliph,
        flippedV: this.flipv,
        croppedImageURI: resultImage
      }
      this.resultCanvas.toBlob((blob) => {
        const nd = new Date()
        blob.lastModified = nd.getTime()
        blob.lastModifiedDate = nd
        blob.name = fname
        finalData.croppedFile = blob
        this.$emit('cropper-saved', finalData)
        if (this.opts.uploadTo) {
          // let formData = new FormData()
          // for (let p in finalData) {
          //   formData.append(p, finalData[p])
          // }
          // for (let m in this.opts.uploadData) {
          //   formData.append(m, this.opts.uploadData[m])
          // }
          // axios.post(this.opts.uploadTo, formData)
          //   .then((response) => {
          //     this.$emit('cropper-uploaded', response)
          //     if (this.opts.closeOnSave) {
          //       this.file = false
          //     }
          //   })
        } else if (this.opts.closeOnSave) {
          this.file = false
        }
      }, this.opts.resultMimeType, this.opts.resultQuality)
    },
    drawCanvas () {
      if (!this.ctx) { return }
      this.drawImageOnCanvas()
      this.drawOverlay()
      this.drawMarkers()
      if (this.opts.showPreview && this.opts.previewOnDrag && this.previewCanvas) {
        this.previewImage = this.previewCanvas.toDataURL('image/jpeg', this.opts.previewQuality)
      }
    },
    drawImageOnCanvas () {
      if (!this.image) { return }
      this.ctx.save()
      if (this.fliph) {
        this.ctx.translate(this.canvasWidth, 0)
        this.ctx.scale(-1, 1)
      }
      if (this.flipv) {
        this.ctx.translate(0, this.canvasHeight)
        this.ctx.scale(1, -1)
      }
      const rotated = this.rotation === 90 || this.rotation === 270
      const w = rotated ? this.canvasHeight : this.canvasWidth
      const h = rotated ? this.canvasWidth : this.canvasHeight
      this.ctx.translate(this.canvasWidth / 2, this.canvasHeight / 2)
      this.ctx.rotate(this.rotation * Math.PI / 180)
      this.ctx.drawImage(this.image, -w / 2, -h / 2, w, h)
      this.ctx.restore()
    },
    drawMarkers () {
      const [mouseX, mouseY] = [this.cx, this.cy]
      const ctx = this.ctx
      this.canvas.style.cursor = 'default'
      this.over = false
      // draw selection border
      ctx.beginPath()
      if (this.opts.cropArea !== 'circle') {
        ctx.rect(this.x, this.y, this.w, this.h)
      } else {
        ctx.arc(this.x + this.w / 2, this.y + this.h / 2, this.w / 2, 0, 2 * Math.PI)
      }
      if (ctx.isPointInPath(mouseX, mouseY)) {
        this.over = 'all'
        this.canvas.style.cursor = 'move'
      }
      ctx.setLineDash(this.opts.frameLineDash)
      ctx.strokeStyle = this.opts.frameStrokeColor
      ctx.stroke()
      // clear dash
      ctx.setLineDash([])
      // draw markers
      for (const p in this.markers) {
        const marker = this.markers[p]
        ctx.beginPath()
        ctx.rect(marker.x, marker.y, this.opts.handleSize * 2, this.opts.handleSize * 2)
        ctx.fillStyle = this.opts.handleFillColor
        ctx.strokeStyle = this.opts.handleStrokeColor
        if (ctx.isPointInPath(mouseX, mouseY)) {
          ctx.fillStyle = this.opts.handleHoverFillColor
          ctx.strokeStyle = this.opts.handleHoverStrokeColor
          this.canvas.style.cursor = p + '-resize'
          this.over = p
        }
        ctx.fill()
        ctx.stroke()
      }
    },
    drawOverlay () {
      const ctx = this.ctx
      ctx.fillStyle = this.opts.overlayFill
      ctx.fillRect(0, 0, this.canvasWidth, this.y)
      ctx.fillRect(0, this.y, this.x, this.h)
      ctx.fillRect(this.x + this.w, this.y, this.canvasWidth - (this.x + this.w), this.h)
      ctx.fillRect(0, this.y + this.h, this.canvasWidth, this.canvasHeight - (this.y + this.h))
      if (this.opts.cropArea === 'circle') {
        ctx.beginPath()
        ctx.arc(this.x + this.w / 2, this.y + this.h / 2, this.w / 2, Math.PI, 1.5 * Math.PI)
        ctx.lineTo(this.x, this.y)
        ctx.closePath()
        ctx.fill()
        ctx.beginPath()
        ctx.arc(this.x + this.w / 2, this.y + this.h / 2, this.w / 2, 1.5 * Math.PI, 2 * Math.PI)
        ctx.lineTo(this.x + this.w, this.y)
        ctx.closePath()
        ctx.fill()
        ctx.beginPath()
        ctx.arc(this.x + this.w / 2, this.y + this.h / 2, this.w / 2, 0, 0.5 * Math.PI)
        ctx.lineTo(this.x + this.w, this.y + this.h)
        ctx.closePath()
        ctx.fill()
        ctx.beginPath()
        ctx.arc(this.x + this.w / 2, this.y + this.h / 2, this.w / 2, 0.5 * Math.PI, Math.PI)
        ctx.lineTo(this.x, this.y + this.h)
        ctx.closePath()
        ctx.fill()
      }
    },
    dropFile (evt) {
      const file = evt.dataTransfer.files[0]
      this.useFile(file)
    },
    flip (direction) {
      if (direction === 'v') {
        this.flipv = !this.flipv
        this.y = this.canvasHeight - this.y - this.h
      } else {
        this.fliph = !this.fliph
        this.x = this.canvasWidth - this.x - this.w
      }
      this.drawCanvas()
      if (this.opts.showPreview && !this.opts.previewOnDrag && this.previewCanvas) {
        this.previewImage = this.previewCanvas.toDataURL('image/jpeg', this.opts.previewQuality)
      }
    },
    getFullWidth () {
      const elSize = this.$el.getBoundingClientRect()
      this.fullWidth = elSize.width
      this.$nextTick(this.drawCanvas)
    },
    humanFileSize: function (bytes, si) {
      if (si === undefined) si = true
      const thresh = si ? 1000 : 1024
      if (Math.abs(bytes) < thresh) {
        return bytes + ' B'
      }
      const units = si
        ? ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
        : ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB']
      let u = -1
      do {
        bytes /= thresh
        ++u
      } while (Math.abs(bytes) >= thresh && u < units.length - 1)
      return bytes.toFixed(1) + ' ' + units[u]
    },
    moveMouse (evt) {
      const mx = evt.clientX || evt.touches[0].clientX
      const my = evt.clientY || evt.touches[0].clientY
      const dx = mx - this.mx
      const dy = my - this.my
      if (this.dragged) { this.updateCoords(dx, dy) }
      this.mx = mx
      this.my = my
      this.drawCanvas()
    },
    rotate (delta) {
      const canvasSize = [this.canvasWidth, this.canvasHeight]
      if (this.fliph ? !this.flipv : this.flipv) {
        this.rotation -= delta
      } else {
        this.rotation += delta
      }
      if (this.rotation > 270) { this.rotation = 0 }
      if (this.rotation < 0) { this.rotation = 270 }
      const w = this.imageWidth
      const h = this.imageHeight
      this.imageWidth = h
      this.imageHeight = w
      this.$nextTick(() => {
        const scaleX = this.canvasHeight / canvasSize[0]
        const scaleY = this.canvasWidth / canvasSize[1]
        const nx = this.canvasWidth - this.y * scaleY - this.h * scaleY
        const ny = this.x * scaleX
        const nw = this.h * scaleY * this.opts.aspectRatio
        const nh = this.w * scaleX * this.opts.aspectRatio
        this.x = Math.round(nx)
        this.y = Math.round(ny)
        this.w = Math.round(nw)
        this.h = Math.round(nh)
        if (this.firstCropFullImage) {
          this.x = 8
          this.y = 8
          this.w = this.canvasWidth - 16
          this.h = this.canvasHeight - 16
        }
        this.updateCoords()
        this.drawCanvas()
        if (this.opts.showPreview && !this.opts.previewOnDrag && this.previewCanvas) {
          this.previewImage = this.previewCanvas.toDataURL('image/jpeg', this.opts.previewQuality)
        }
      })
    },
    selectFile (evt) {
      const file = evt.currentTarget.files[0]
      if (file) { this.useFile(file) }
      this.getFullWidth()
    },
    startCanvas () {
      if (this.image) {
        this.canvas = this.$refs.canvas
        this.ctx = this.canvas.getContext('2d')
        const [ir, ar] = [this.imageRatio, this.opts.aspectRatio]
        if (!ar) {
          this.w = Math.round(this.canvasWidth / 2)
          this.h = Math.round(this.canvasHeight / 2)
        } else if (ar >= ir) {
          this.w = Math.round(this.canvasWidth / 2)
          this.h = Math.round(this.w / ar)
        } else {
          this.h = Math.round(this.canvasHeight / 2)
          this.w = Math.round(this.h * ar)
        }
        this.x = Math.round((this.canvasWidth - this.w) / 2)
        this.y = Math.round((this.canvasHeight - this.h) / 2)
        if (this.firstCropFullImage) {
          this.x = 8
          this.y = 8
          this.w = this.canvasWidth - 16
          this.h = this.canvasHeight - 16
        }
        this.drawCanvas()
      } else {
        this.canvas = false
        this.ctx = false
      }
      if (this.opts.showPreview && this.previewCanvas) {
        this.previewImage = this.previewCanvas.toDataURL('image/jpeg', this.opts.previewQuality)
      }
      this.canvas.addEventListener('touchstart', (e) => {
        e.preventDefault()
        this.startDrag(e)
      })
      this.canvas.addEventListener('touchend', (e) => {
        e.preventDefault()
        this.stopDrag(e)
      })
      this.canvas.addEventListener('touchmove', (e) => {
        e.preventDefault()
        this.moveMouse(e)
      })
    },
    startDrag (e) {
      if (e.touches !== undefined) {
        this.mx = e.touches[0].clientX
        this.my = e.touches[0].clientY
        this.drawCanvas()
      }
      this.dragged = this.over
    },
    stopDrag () {
      this.dragged = false
      const preview = this.resultCanvas.toDataURL('image/jpeg', this.opts.previewQuality)
      this.$emit('cropper-preview', preview)
      if (this.opts.showPreview && this.previewCanvas) {
        this.previewImage = this.previewCanvas.toDataURL('image/jpeg', this.opts.previewQuality)
      }
    },
    triggerInput () {
      const input = this.$refs.fileInput
      input.click()
    },
    updateCoords (dx, dy) {
      let nx = this.x
      let ny = this.y
      let nw = this.w
      let nh = this.h
      const ar = this.opts.aspectRatio
      switch (this.dragged) {
        case 'all':
          nx = this.x + dx
          ny = this.y + dy
          break
        case 'nw':
          nx = this.x + dx
          ny = this.y + dy
          nw = this.w - dx
          nh = this.h - dy
          break
        case 'ne':
          ny = this.y + dy
          nw = this.w + dx
          nh = this.h - dy
          break
        case 'sw':
          nx = this.x + dx
          nw = this.w - dx
          nh = this.h + dy
          break
        case 'se':
          nw = this.w + dx
          nh = this.h + dy
          break
      }
      // keep aspect ratio
      if (ar) {
        nh = nw / ar
      }
      // keep minimal dimensions
      if (nw < this.minW || nh < this.minH) {
        if (ar && ar > 1) {
          nh = this.minH
          nw = nh * ar
        } else if (ar && ar < 1) {
          nw = this.minW
          nh = nw / ar
        } else {
          if (nw < this.minW) { nw = this.minW }
          if (nh < this.minH) { nh = this.minH }
        }
      }
      // don't expand over canvas width
      if (nw + nx > this.canvasWidth) {
        nw = this.canvasWidth - nx
        if (ar) { nh = nw / ar }
        if (nw / ar < this.minH && ar && ar > 1) {
          nh = this.minH
          nw = nh * ar
          nx = this.canvasWidth - nw
        }
        if (nw < this.minW) {
          nw = this.minW
          nx = this.canvasWidth - nw
        }
      }
      // don't expand over canvas height
      if (nh + ny > this.canvasHeight) {
        nh = this.canvasHeight - ny
        if (ar) { nw = nh * ar }
        if (nh * ar < this.minW && ar && ar < 1) {
          nw = this.minW
          nh = nw / ar
          ny = this.canvasHeight - nh
        }
        if (nh < this.minH) {
          nh = this.minH
          ny = this.canvasHeight - nh
        }
      }
      // dont cross 0 borders
      if (nx < 0) { nx = 0 }
      if (ny < 0) { ny = 0 }
      this.x = nx
      this.y = ny
      this.w = nw
      this.h = nh
    },
    useFile (file) {
      if (this.allowedMimeTypes.indexOf(file.type) === -1) {
        this.$emit('cropper-error', 'Wrong file type: ' + file.type)
        return
      }
      if (this.opts.maxFileSize && file.size > this.opts.maxFileSize) {
        const fileSize = this.humanFileSize(file.size)
        this.$emit('cropper-error', 'File too large (' + fileSize + ')! Max file size is ' + this.humanFileSize(this.opts.maxFileSize))
        return
      }
      this.file = file
      this.$emit('cropper-file-selected', file)
    }
  }
}
</script>
<style>
.u-crop {
  border-radius: 3px;
  position: relative;
  overflow: hidden;
  font-size: 16px;
  text-decoration: none;
}
.u-crop__navigation {
  padding: 12px;
  border-radius: 3px;
}
.u-crop__rightButton{
  float: right;
  margin-right: 10px;
}
.u-crop__mainArea {
  margin: 12px;
  box-sizing: border-box;
  overflow: hidden;
  text-align: center;
}
.u-crop__previewArea {
  display: flex;
  justify-content: center;
  align-items: center;
}

</style>
