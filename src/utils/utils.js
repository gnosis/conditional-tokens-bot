/**
 * Truncate a given text `fullStr` into a limited `strLen` with 
 * a separation `separator` in the middle.
 * @param  {} fullStr the text to be truncated.
 * @param  {} strLen max. length to start to truncate the given text at
 * `fullStr`.
 * @param  {} separator (optional) if `separator` is not setted the
 * default value is '...'.
 * @returns truncated text.
 */
const truncate = (fullStr, strLen, separator) => {
    if (fullStr.length <= strLen) return fullStr;

    separator = separator || '...';

    var sepLen = separator.length,
        charsToShow = strLen - sepLen,
        frontChars = Math.ceil(charsToShow/2),
        backChars = Math.floor(charsToShow/2);

    return fullStr.substr(0, frontChars) + 
           separator + 
           fullStr.substr(fullStr.length - backChars);
};

module.exports = {
    truncate,
}