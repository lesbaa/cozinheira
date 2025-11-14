// import { LngLatBounds } from "maplibre-gl";
import { GLSL3, ShaderMaterial } from "three";
import vertexShader from './MapProviderMaterial.vert.glsl?raw';
import fragmentShader from './MapProviderMaterial.frag.glsl?raw';
import * as turf from '@turf/turf';
import { Map as SDKMap, MapStyle, MapStyleVariant, type CenterZoomBearing, LngLatBounds, LngLat } from "@maptiler/sdk";

// function constructBoundsUrl({
//   center,
//   style = 'satellite',
//   dims = [1024, 1024],
//   zoom = 18,
// }: {
//   center: LngLat;
//   style?: 'satellite' | 'streets' | 'hybrid';
//   dims: [number, number];
//   zoom: number;
// }): string {
//   const [width, height] = dims;
//   return `/bounds/${center.lng},${center.lat}/${zoom}/${style ?? 'satellite'}?w=${width}&h=${height}`;
// }

// const loader = new TextureLoader();
// loader.setPath(import.meta.env.VITE_MAP_PROVIDER_URL);

interface MapProviderMaterialParameters {
  bounds: [number, number, number, number];
  style?: MapStyleVariant;
}

interface MLMapParameters {
  bounds: [number, number, number, number];
  style?: MapStyleVariant;
}

class MLMap {
  private map: SDKMap;
  private container!: HTMLElement;
  private bounds: LngLatBounds;

  constructor({ bounds, style = MapStyle.SATELLITE.DEFAULT as MapStyleVariant }: MLMapParameters) {
    this.bounds = new LngLatBounds(
      new LngLat(bounds[0], bounds[1]),
      new LngLat(bounds[2], bounds[3]),
    );
    this.initContainer();
    
    this.map = new SDKMap({
      container: this.container,
      attributionControl: false,
      style,
      apiKey: import.meta.env.VITE_MAP_PROVIDER_API_KEY,
      navigationControl: false,
      forceNoAttributionControl: true,
      scaleControl: false,
      geolocate: false,
      projectionControl: false,
      geolocateControl: false,
    });

    this.initMap();
  }

  async initMap() {
    await this.map.onReadyAsync();
    const cam = this.map.cameraForBounds(this.bounds) as CenterZoomBearing;

    this.map.jumpTo(cam);
  }

  getMap() {
    return this.map
  }

  calculateDimensions(bounds: LngLatBounds, scale: number = 5000): [number, number] {
    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();

    const width = turf.distance(
      turf.point([ne.lng, ne.lat]),
      turf.point([ne.lng, sw.lat]),
      'kilometers',
    );

    const height = turf.distance(
      turf.point([ne.lng, ne.lat]),
      turf.point([sw.lng, ne.lat]),
      'kilometers',
    );
    return [width, height].map(d => Math.round(d * scale)) as [number, number];
  }

  initContainer() {
    const container = document.createElement('div');
    this.container = container;
    this.container.id = 'map-provider-container';
    const [width, height] = this.calculateDimensions(this.bounds);

    this.container.style.position = 'absolute';
    // this.container.style.display = 'none';
    this.container.style.top = `${-height - 100}px`;
    this.container.style.width = `${width}px`;
    this.container.style.height = `${height}px`;

    document.body.appendChild(this.container);
  }

  destroy() {
    this.map.remove();
  }

}

export default class MapProviderMaterial extends ShaderMaterial {
  private mapInstance: MLMap;
  constructor({ bounds, style }: MapProviderMaterialParameters) {

    const map = new MLMap({ bounds, style });
    super({
      glslVersion: GLSL3,
      vertexShader,
      fragmentShader,
      uniforms: {
        uTexture: { value: null },
      }
    });
    this.mapInstance = map;
  }

  destroy() {
    this.mapInstance.destroy();
  }
}