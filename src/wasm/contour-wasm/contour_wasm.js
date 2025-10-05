export default async function initContourWasm() {
  const wasm = await import('./contour_wasm_bg.wasm')
  const contourWasm = await import('./contour_wasm_bg.js')
  contourWasm.__wbg_set_wasm(wasm);
  return contourWasm;
}