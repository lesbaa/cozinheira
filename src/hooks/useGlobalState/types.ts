import type { LngLat } from "@maptiler/sdk";
import type { FeatureHoverEventData } from "../../components/Features";
import type { ColorRamp } from "../../utils/ColorRamp";
import type { Vector2 } from "three";

export type GlobalState = {
    showContour: boolean,
    showPoints: boolean,
    showSlope: boolean,
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
    value: StateValue;
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
  setValue: (key: keyof GlobalState, value: StateValue) => void;
  resetPopover: () => void;
  setFeatureInfo: (feature: FeatureHoverEventData | null) => void;
  setMouseScreenPos: (pos: Vector2) => void;
};
