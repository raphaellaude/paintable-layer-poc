import "./style.css";
import { tableFromIPC } from "apache-arrow";
import { parseField, parseVector } from "arrow-js-ffi";

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

import { MapboxOverlay as DeckOverlay } from "@deck.gl/mapbox";
import { GeoJsonLayer, ArcLayer } from "@deck.gl/layers";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

// source: Natural Earth http://www.naturalearthdata.com/ via geojson.xyz
const AIR_PORTS =
  "https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_10m_airports.geojson";

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

const deckOverlay = new DeckOverlay({
  // interleaved: true,
  layers: [
    new GeoJsonLayer({
      id: "airports",
      data: AIR_PORTS,
      // Styles
      filled: true,
      pointRadiusMinPixels: 2,
      pointRadiusScale: 2000,
      getPointRadius: (f) => 11 - f.properties.scalerank,
      getFillColor: [200, 0, 80, 180],
      // Interactive props
      pickable: true,
      autoHighlight: true,
      onClick: (info) =>
        // eslint-disable-next-line
        info.object &&
        alert(
          `${info.object.properties.name} (${info.object.properties.abbrev})`,
        ),
      // beforeId: 'waterway-label' // In interleaved mode render the layer under map labels
    }),
    new ArcLayer({
      id: "arcs",
      data: AIR_PORTS,
      dataTransform: (d) =>
        d.features.filter((f) => f.properties.scalerank < 4),
      // Styles
      getSourcePosition: (f) => [-0.4531566, 51.4709959], // London
      getTargetPosition: (f) => f.geometry.coordinates,
      getSourceColor: [0, 128, 200],
      getTargetColor: [200, 0, 80],
      getWidth: 1,
    }),
  ],
});

map.addControl(deckOverlay);
map.addControl(new mapboxgl.NavigationControl());