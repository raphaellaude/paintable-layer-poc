import { useEffect, useRef } from "react";
import { AutomergeUrl, RawString } from "@automerge/automerge-repo";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Protocol } from "pmtiles";
import { useDocument } from "@automerge/automerge-repo-react-hooks";
import { Plan } from "../App";

// const colorMap: string[] = ["#2090FF", "#ffff22", "#cccccc"]
//
interface Point {
  x: number;
  y: number;
}

export default function Map({ docUrl }: { docUrl: AutomergeUrl }) {
  const [doc, changeDoc] = useDocument<Plan>(docUrl);
  const mapContainer = useRef(null);
  const map = useRef(null);

  useEffect(() => {
    const protocol = new Protocol();
    maplibregl.addProtocol("pmtiles", protocol.tile);

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          wisconsin_blocks: {
            type: "vector",
            url: "pmtiles:///wisconsin_blocks.pmtiles",
          },
        },
        layers: [
          {
            id: "background",
            type: "background",
            paint: {
              "background-color": "#efefef",
            },
          },
        ],
      },
      center: [-89.6787214, 44.3140374],
      zoom: 6,
      maxZoom: 20.9,
      minZoom: 5,
    });

    map.current.on("load", () => {
      map.current.addLayer({
        id: "blocks",
        type: "line",
        source: "wisconsin_blocks",
        "source-layer": "tl_2023_55_tabblock20",
        paint: {
          "line-color": "#cccccc",
          "line-width": 1,
        },
      });

      const landmarkPaintProperty = {
        "fill-opacity": 0.5, // turn off the highlights by default
        "fill-color": [
          "case",
          ["boolean", ["feature-state", "hover"], false],
          "#ff4f49",
          "#e44944",
        ],
      };

      map.current.addLayer({
        id: "blocks-hover",
        type: "fill",
        source: "wisconsin_blocks",
        "source-layer": "tl_2023_55_tabblock20",
        paint: landmarkPaintProperty,
      });
    });

    function boxAround(point: Point, radius: number) {
      const southwest = [point.x + radius, point.y + radius];
      const northeast = [point.x - radius, point.y - radius];
      return [northeast, southwest];
    }

    function onMouseMove(e) {
      const box = boxAround(e.point, 4);
      const features = map.current.queryRenderedFeatures(box, {
        layers: ["blocks"],
      });
      if (features.length > 0) {
        // features.forEach((feat) => {
        //   map.current.setFeatureState(feat.id, {
        //     ...feat.state,
        //     hover: true,
        //   });
        // });
        console.log(features.length);
        // console.log(features.map((f) => f.properties.geoid));
      }
    }

    map.current.on("mousemove", onMouseMove);

    function addAssignments(features) {
      console.log("adding assignments", doc);
      changeDoc((d) => {
        const key = doc.name.toString();
        console.log(key);

        features.forEach((feat) => {
          const key = feat.properties.geoid;
          const currentAssignment = d.assignments[key];
          console.log(currentAssignment);

          if (currentAssignment !== undefined) {
            d.assignments[key] = currentAssignment + 1;
          } else {
            d.assignments[key] = 1;
          }
        });
      });
    }

    function onMouseClick(e) {
      const box = boxAround(e.point, 4);
      const features = map.current.queryRenderedFeatures(box, {
        layers: ["blocks"],
      });
      if (features.length > 0) {
        console.log(features);
        addAssignments(features);
      }
    }

    map.current.on("click", onMouseClick);

    map.current.addControl(new maplibregl.NavigationControl());

    return () => {
      maplibregl.removeProtocol("pmtiles");
      map.current.remove();
    };
  }, []);

  return (
    <>
      <div ref={mapContainer}></div>
    </>
  );
}
