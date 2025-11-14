import { CanvasTexture, DoubleSide, GLSL3, ShaderMaterial, Vector3, Color } from "three";
import vertexShader from './DataMaterial.vert.glsl?raw';
import fragmentShader from './DataMaterial.frag.glsl?raw';

type DataMaterialParameters = {
  maxValue: number;
  minValue: number;
  perimiter: Vector3[];
  colorRamp: {
    color: string;
    value: number;
  }[];
  contour: boolean;
  contourColor: Color;
}

export default class DataMaterial extends ShaderMaterial {
  constructor({
    maxValue,
    minValue,
    perimiter,
    colorRamp,
  }: DataMaterialParameters) {
    const c = document.createElement('canvas');
    const ctx = c.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get context');
    };
    const colorRampCanvas = { ctx , c };

    c.width = 1;
    c.height = 256;

    const colorRampTexture = new CanvasTexture();

    if (!colorRampCanvas) return;

    const gradient = colorRampCanvas.ctx.createLinearGradient(0, 0, 0, 256);

    colorRamp.forEach((stop) => {
      gradient.addColorStop(stop.value, stop.color);
    });

    colorRampCanvas.ctx.fillStyle = gradient;
    colorRampCanvas.ctx.fillRect(0, 0, 1, 256);

    colorRampTexture.image = colorRampCanvas.c;
    colorRampTexture.needsUpdate = true;

    super({
      glslVersion: GLSL3,
      vertexShader,
      defines: {
        MAX_POLYGON_VERTICES: perimiter.length,
      },
      fragmentShader,
      uniforms: {
        uMaxValue: { value: maxValue },
        uMinValue: { value: minValue },
        uContour: { value: false },
        uContourColor: { value: [1.0, 1.0, 1.0, 1.0] },
        uShowSlope: { value: false },
        uNumPerimeterPoints: { value: perimiter.length },
        uPerimeterPoints: { value: perimiter },
        uColorRamp: { value: colorRampTexture },
      },
      side: DoubleSide,
    })
  }
}