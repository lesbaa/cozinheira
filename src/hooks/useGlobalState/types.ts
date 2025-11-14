import type { LngLat } from "@maptiler/sdk";
import type { FeatureHoverEventData } from "../../components/Features/Features";
import type { ColorRamp } from "../../utils/ColorRamp";
import type { Vector2 } from "three";

export type GlobalState = {
    showContour: boolean,
    showPoints: boolean,
    showOptions: boolean,
    terrainMaterial: 'heightMap' | 'mapMaterial' | 'slopeMap',
    popoverState: {
      lngLat: LngLat,
      altitude: number,
      transformX: number,
      transformY: number,
      visible: boolean,
    },
    featureInfo: FeatureHoverEventData | null,
    colorRamp: ColorRamp,
    mouseScreenPos: Vector2,
  };

export type GlobalStateAction = {
  type: 'setValue'
  payload: {
    key: keyof GlobalState;
    value: GlobalState[keyof GlobalState];
  };
} | {
  type: 'resetPopover';
} | {
  type: 'setFeatureInfo';
  payload: FeatureHoverEventData | null;
} | {
  type: 'setMouseScreenPos';
  payload: Vector2;
};

export type StateValue = boolean | number | string | null | undefined;

export type GlobalStateContextValue = {
  state: GlobalState;
  setValue: <K extends keyof GlobalState>(key: K, value: GlobalState[K] | ((currentValue: GlobalState[K]) => GlobalState[K])) => void;
  resetPopover: () => void;
  setFeatureInfo: (feature: FeatureHoverEventData | null) => void;
  setMouseScreenPos: (pos: Vector2) => void;
};
