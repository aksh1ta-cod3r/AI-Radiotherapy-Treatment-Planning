/**
 * npyParser.js
 * 
 * Purpose: Client-side binary parser for NumPy (.npy) files.
 * Why this approach was chosen:
 *   - Allows direct drag-and-drop loading and processing of patient .npy files in the browser.
 *   - No backend preprocessing Python server is required.
 *   - Native TypedArrays provide near-instant parsing and rendering.
 */

/**
 * Decodes little-endian UTF-32 bytes into a JavaScript string.
 */
function decodeUTF32LE(arrayBuffer, offset, length) {
  const view = new DataView(arrayBuffer, offset, length);
  const charCount = length / 4;
  let str = '';
  for (let i = 0; i < charCount; i++) {
    const code = view.getUint32(i * 4, true); // Little endian
    if (code === 0) continue; // Skip null padding
    str += String.fromCodePoint(code);
  }
  return str.trim();
}

/**
 * Parses the raw metadata header of any NumPy (.npy) file.
 */
export function parseNpyHeader(arrayBuffer) {
  const view = new DataView(arrayBuffer);
  
  // 1. Verify Magic String '\x93NUMPY'
  const magic = String.fromCharCode(
    view.getUint8(0), view.getUint8(1), view.getUint8(2),
    view.getUint8(3), view.getUint8(4), view.getUint8(5)
  );
  if (magic !== '\x93NUMPY') {
    throw new Error('Invalid .npy file: Magic header mismatch.');
  }
  
  const major = view.getUint8(6);
  
  let headerLen = 0;
  let headerOffset = 10;
  
  if (major === 1) {
    headerLen = view.getUint16(8, true);
  } else if (major === 2) {
    headerLen = view.getUint32(8, true);
    headerOffset = 12;
  } else {
    throw new Error('Unsupported numpy version: ' + major);
  }
  
  const decoder = new TextDecoder('utf-8');
  const headerBytes = new Uint8Array(arrayBuffer, headerOffset, headerLen);
  const headerStr = decoder.decode(headerBytes).trim();
  
  // Parse header dict parameters: descr, fortran_order, shape
  const descrMatch = headerStr.match(/'descr':\s*'([^']+)'/);
  const fortranMatch = headerStr.match(/'fortran_order':\s*(True|False)/i);
  const shapeMatch = headerStr.match(/'shape':\s*\(([^)]*)\)/);
  
  if (!descrMatch || !shapeMatch) {
    throw new Error('Failed to parse .npy header fields.');
  }
  
  const descr = descrMatch[1];
  const fortranOrder = fortranMatch ? fortranMatch[1].toLowerCase() === 'true' : false;
  
  // Handle empty shape or trailing commas
  const shapeStr = shapeMatch[1].replace(/,/g, ' ').trim();
  const shape = shapeStr === '' ? [] : shapeStr.split(/\s+/).map(Number);
  
  return {
    descr,
    fortranOrder,
    shape,
    dataOffset: headerOffset + headerLen
  };
}

/**
 * Parses numeric NumPy (.npy) arrays into corresponding JS TypedArrays.
 */
export function parseNpy(arrayBuffer) {
  const header = parseNpyHeader(arrayBuffer);
  const { descr, shape, dataOffset } = header;
  
  const dataBuffer = arrayBuffer.slice(dataOffset);
  
  let data;
  if (descr === '<f4' || descr === '|f4') {
    data = new Float32Array(dataBuffer);
  } else if (descr === '<f8' || descr === '|f8') {
    data = new Float64Array(dataBuffer);
  } else if (descr === '<i4' || descr === '|i4') {
    data = new Int32Array(dataBuffer);
  } else if (descr === '|u1' || descr === '<u1') {
    data = new Uint8Array(dataBuffer);
  } else if (descr === '|i1' || descr === '<i1') {
    data = new Int8Array(dataBuffer);
  } else if (descr === '<u2' || descr === '|u2') {
    data = new Uint16Array(dataBuffer);
  } else {
    // Fallback or generic array
    data = new Uint8Array(dataBuffer);
  }
  
  return {
    dtype: descr,
    shape,
    data
  };
}

/**
 * Parses NumPy string arrays (UTF-32 encoded, like '<U10').
 */
export function parseNpyStringArray(arrayBuffer) {
  const header = parseNpyHeader(arrayBuffer);
  const { descr, shape, dataOffset } = header;
  
  const lengthMatch = descr.match(/[<>]U(\d+)/);
  if (!lengthMatch) {
    throw new Error('Not a string array dtype: ' + descr);
  }
  
  const strLen = parseInt(lengthMatch[1]);
  const elementSize = strLen * 4; // UTF-32 uses 4 bytes per char
  const numElements = shape.reduce((a, b) => a * b, 1);
  
  const result = [];
  for (let i = 0; i < numElements; i++) {
    const offset = dataOffset + i * elementSize;
    const str = decodeUTF32LE(arrayBuffer, offset, elementSize);
    result.push(str);
  }
  
  return result;
}

/**
 * Parses scalar NumPy arrays (like patient_id.npy, spacing.npy).
 */
export function parseNpyScalar(arrayBuffer) {
  const header = parseNpyHeader(arrayBuffer);
  const { descr, shape, dataOffset } = header;
  
  // If it's a string scalar
  if (descr.includes('U')) {
    const elementSize = arrayBuffer.byteLength - dataOffset;
    return decodeUTF32LE(arrayBuffer, dataOffset, elementSize);
  }
  
  // If it's numeric
  const numericVal = parseNpy(arrayBuffer);
  if (numericVal.data.length > 0) {
    return numericVal.data[0];
  }
  
  return null;
}

export default {
  parseNpyHeader,
  parseNpy,
  parseNpyStringArray,
  parseNpyScalar
};
