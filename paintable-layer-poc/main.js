import "./style.css";
import { tableFromIPC } from "apache-arrow";
// import initWasm, { readSchema } from "parquet-wasm";

// await initWasm();
// import { parseField, parseVector } from "arrow-js-ffi";

// const arrowJsFFI = await import(
//   "https://unpkg.com/arrow-js-ffi@0.2.0/dist/arrow-js-ffi.umd.js"
// );
const parquetModule = await import(
  "https://unpkg.com/parquet-wasm@0.6.0/esm/parquet_wasm.js"
);
// Need to await the default export first to initialize the WebAssembly code
await parquetModule.default();

const geoarrowModule = await import(
  "https://unpkg.com/geoarrow-wasm@0.1.0/esm/index.js"
);

// // Need to await the default export first to initialize the WebAssembly code
const { memory } = await geoarrowModule.default();
const geoarrow = geoarrowModule[0];
const geoarrowMemory = geoarrowModule[1];

import { MapboxOverlay as DeckOverlay } from "@deck.gl/mapbox";
import { SolidPolygonLayer } from "@deck.gl/layers";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

// Set your Mapbox token here or via environment variable
const MAPBOX_TOKEN = import.meta.env.VITE_MapboxAccessToken; // eslint-disable-line

const map = new mapboxgl.Map({
  container: "map",
  style: "mapbox://styles/mapbox/light-v9",
  accessToken: MAPBOX_TOKEN,
  center: [0.45, 51.47],
  zoom: 4,
  bearing: 0,
  pitch: 0,
});

map.on("load", () => {
  const getData = async () => {
    const parquetPath = "./tl_2023_55_tabblock20.parquet";
    const parquetBytes = new Uint8Array(
      await fetch(parquetPath).then((response) => response.arrayBuffer()),
    );
    return parquetBytes;
  };

  const parquetBytes = getData();

  console.log(parquetBytes);

  const decodedArrowBytes = parquetModule.readParquet(parquetBytes, {
    batchSize: Math.pow(2, 31),
  });
  const arrowTable = tableFromIPC(decodedArrowBytes.intoIPCStream());

  console.log(arrowTable);
  console.log(arrowTable.schema.fields[0]);

  let geometryColumn = arrowTable.getChild("geometry");

  console.log(geometryColumn);

  // const flatCoordinateVector = geometryColumn
  //     .getChildAt(0)
  //     .getChildAt(0)
  //     .getChildAt(0);

  // let flatCoordinateArray = flatCoordinateVector.data[0].values;
  let polygonOffsets = geometryColumn.getChildAt(0).data[0].valueOffsets;
  let geomOffsets = geometryColumn.data[0].valueOffsets;

  // const coordBuffer = geoarrow.CoordBuffer.from_interleaved_coords(
  //     new geoarrow.InterleavedCoordBuffer(flatCoordinateArray)
  //   );

  // const polygonArray = new geoarrow.PolygonArray(
  //     coordBuffer,
  //     geomOffsets,
  //     polygonOffsets
  //   );

  const resolvedIndices = new Int32Array(geomOffsets.length);
  for (let i = 0; i < resolvedIndices.length; ++i) {
    // Perform the lookup into the polygonOffsets array using the geomOffsets array
    resolvedIndices[i] = polygonOffsets[geomOffsets[i]];
  }

  const data = {
    // Number of geometries
    length: geometryColumn.length,
    // Indices into coordinateArray where each polygon starts
    startIndices: resolvedIndices,
    attributes: {
      // Flat coordinates array
      getPolygon: { value: flatCoordinateArray, size: 2 },
      // Pass in the color values per coordinate vertex
      getFillColor: { value: colorAttribute, size: 3 },
    },
  };
  const layer = new SolidPolygonLayer({
    // This is an Observable hack - changing the id will force the layer to refresh when the cell reevaluates
    id: `layer-${Date.now()}`,
    data,
    // Skip normalization for binary data
    _normalize: false,
    // Counter-clockwise winding order
    _windingOrder: "CCW",
  });

  const deckOverlay = new DeckOverlay({
    // interleaved: true,
    layers: [layer],
  });

  map.addControl(deckOverlay);
  map.addControl(new mapboxgl.NavigationControl());
});
