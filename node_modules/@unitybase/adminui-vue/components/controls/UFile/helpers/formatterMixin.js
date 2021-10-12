module.exports = {
  methods: {
    /**
     * Humanize file size
     *
     * @param {number} bytes File size
     * @param {number} [decimals=2] Decimals, 2 by default
     * @returns {string} Humanized file size
     */
    formatBytes (bytes, decimals) {
      const sizes = ['sizeUnits.b', 'sizeUnits.kb', 'sizeUnits.mb', 'sizeUnits.gb', 'sizeUnits.tb']
      if (bytes === 0) return `0 ${this.$ut(sizes[0])}`
      const k = 1024
      const dm = decimals <= 0 ? 0 : decimals || 2
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + this.$ut(sizes[i])
    },

    /**
     * Get file extension from file name.
     *
     * @param {string} str File name
     * @returns {string} Extension in upper case
     */
    getType (str) {
      const arr = str.split('.')
      return arr[arr.length - 1].toUpperCase()
    }
  }
}
