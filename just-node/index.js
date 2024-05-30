import { parseSchema } from "arrow-js-ffi";
import initWasm, { readSchema, wasmMemory } from "parquet-wasm";

// Instantiate the WebAssembly context
await initWasm();
const WASM_MEMORY = wasmMemory();

const resp = await fetch(
  "/Users/raphaellaude/Documents/GitHub/paintable-layer-poc/elt/assets/tl_2023_55_tabblock20.parquet",
);
const parquetUint8Array = new Uint8Array(await resp.arrayBuffer());
const arrowWasmSchema = readSchema(parquetUint8Array);
const ffiSchema = arrowWasmSchema.intoFFI();
const arrowTable = parseSchema(WASM_MEMORY.buffer, ffiSchema.addr());
const arrowSchema = arrowTable.schema;

console.log(arrowSchema);
