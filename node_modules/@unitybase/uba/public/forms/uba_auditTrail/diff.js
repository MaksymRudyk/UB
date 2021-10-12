module.exports = { diff, diffWords }

/**
 * @typedef {object} DiffAtom
 * @property {('none'|'add'|'delete')} operation
 * @property {string} word
 */

/**
 * @typedef {object} DiffSideBySide
 * @property {DiffAtom[]} oldValue Diff atoms for "delete" operation
 * @property {DiffAtom[]} newValue Diff atoms for "add" operation
 */

/**
 * Diff in subsequences.
 *
 * @param {string[]} oldValue sequences
 * @param {string[]} newValue sequences
 * @return {DiffSideBySide}
 */
function diff (oldValue, newValue) {
  const lcs = longestCommonSubsequence(oldValue, newValue)

  function buildDiff (words, operation) {
    const diffs = []
    let lastLcsIndex = 0

    for (const word of words) {
      if (word === lcs[lastLcsIndex]) {
        lastLcsIndex++
        diffs.push({
          operation: 'none',
          word
        })
      } else {
        diffs.push({
          operation,
          word
        })
      }
    }

    return diffs
  }

  return {
    oldValue: buildDiff(oldValue, 'delete'),
    newValue: buildDiff(newValue, 'add')
  }
}

/**
 * @param {string} oldValue
 * @param {string} newValue
 * @return {DiffSideBySide}
 */
function diffWords (oldValue, newValue) {
  return diff(splitByWords(oldValue), splitByWords(newValue))
}

/**
 * Splits string by symbols which usually divide words.
 *
 * @param {string} str
 * @return {string[]}
 */
function splitByWords (str) {
  return str
    .split(/(\s|\n|,|\.|;|"|'|_|#|<|>|\(|\)|{|}|\?|!|\[|\]|:|%|\||\\|\*|\/|-|\+)/)
}

/**
 * @link https://en.wikipedia.org/wiki/Longest_common_subsequence_problem
 *
 * @param {string[]} set1
 * @param {string[]} set2
 * @return {string[]}
 */
function longestCommonSubsequence (set1, set2) {
  // Init LCS matrix.
  const lcsMatrix = Array(set2.length + 1)
    .fill(null)
    .map(
      () => Array(set1.length + 1)
        .fill(null)
    )

  // Fill first row with zeros.
  for (let columnIndex = 0; columnIndex <= set1.length; columnIndex += 1) {
    lcsMatrix[0][columnIndex] = 0
  }

  // Fill first column with zeros.
  for (let rowIndex = 0; rowIndex <= set2.length; rowIndex += 1) {
    lcsMatrix[rowIndex][0] = 0
  }

  // Fill rest of the column that correspond to each of two strings.
  for (let rowIndex = 1; rowIndex <= set2.length; rowIndex += 1) {
    for (let columnIndex = 1; columnIndex <= set1.length; columnIndex += 1) {
      if (set1[columnIndex - 1] === set2[rowIndex - 1]) {
        lcsMatrix[rowIndex][columnIndex] = lcsMatrix[rowIndex - 1][columnIndex - 1] + 1
      } else {
        lcsMatrix[rowIndex][columnIndex] = Math.max(
          lcsMatrix[rowIndex - 1][columnIndex],
          lcsMatrix[rowIndex][columnIndex - 1]
        )
      }
    }
  }

  // Calculate LCS based on LCS matrix.
  if (!lcsMatrix[set2.length][set1.length]) {
    // If the length of largest common string is zero then return empty string.
    return ['']
  }

  const longestSequence = []
  let columnIndex = set1.length
  let rowIndex = set2.length

  while (columnIndex > 0 || rowIndex > 0) {
    if (set1[columnIndex - 1] === set2[rowIndex - 1]) {
      // Move by diagonal left-top.
      longestSequence.unshift(set1[columnIndex - 1])
      columnIndex -= 1
      rowIndex -= 1
    } else if (lcsMatrix[rowIndex][columnIndex] === lcsMatrix[rowIndex][columnIndex - 1]) {
      // Move left.
      columnIndex -= 1
    } else {
      // Move up.
      rowIndex -= 1
    }
  }

  return longestSequence
}
