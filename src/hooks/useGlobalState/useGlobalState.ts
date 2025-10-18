import { createContext, useCallback, useContext, useMemo, useReducer } from "react";
import type { GlobalState, GlobalStateAction, GlobalStateContextValue, StateValue } from "./types";
import { LngLat } from "@maptiler/sdk";
import ColorRamps, { type ColorRamp } from "../../utils/ColorRamp";
import type { FeatureHoverEventData } from "../../components/Features";
import { Vector2 } from "three";

export default function useGlobalState(): GlobalStateContextValue {
  return useContext(GlobalStateContext);
}

export const initialState = {
  showContour: false,
  showPoints: false,
  showSlope: false,
  popoverState: {
    lngLat: new LngLat(0, 0),
    altitude: 0,
    transformX: -100,
    transformY: -100,
    visible: false,
  },
  featureInfo: null,
  colorRamp: ColorRamps.Lumo as ColorRamp,
  mouseScreenPos: new Vector2(),
};

const initCtxValue = {
  state: initialState,
  setValue: () => {},
  resetPopover: () => {},
  setFeatureInfo: () => {},
  setMouseScreenPos: () => {},
};


export const GlobalStateContext = createContext<GlobalStateContextValue>(initCtxValue);

function globalStateReducer(state: GlobalState, action: GlobalStateAction) {
  switch (action.type) {
    case 'setValue': {
      return { ...state, [action.payload.key]: action.payload.value };
    };
    case 'resetPopover':
      return { ...state, popoverState: {
        lngLat: new LngLat(0, 0),
        altitude: 0,
        transformX: -100,
        transformY: -100,
        visible: false,
      }
    };

    case 'setFeatureInfo': {
      return { ...state, featureInfo: action.payload };
    }

    case 'setMouseScreenPos': {
      return { ...state, mouseScreenPos: action.payload };
    }
  }
}

export function useGlobalStateInternal(): GlobalStateContextValue {
  const [state, dispatch] = useReducer(globalStateReducer, initialState);


  const setValue = useCallback((key: keyof GlobalState, value: StateValue) => {
    dispatch({ type: 'setValue', payload: { key, value } });
  }, []);


  const resetPopover = useCallback(() => {
    dispatch({ type: 'resetPopover' });
  }, []);

  const setFeatureInfo = useCallback((feature: FeatureHoverEventData | null) => {
    dispatch({ type: 'setFeatureInfo', payload: feature });
  }, []);
  
  const setMouseScreenPos = useCallback((pos: Vector2) => {
    dispatch({ type: 'setMouseScreenPos', payload: pos });
  }, []);

  return useMemo(() => ({
    state,
    setValue,
    resetPopover,
    setFeatureInfo,
    setMouseScreenPos,
  }), [state, setValue, resetPopover, setFeatureInfo, setMouseScreenPos]);
}