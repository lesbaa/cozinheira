import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { preloadFeatureMeshes, type PreloadedFeatureMeshes } from "../../utils/preloadFeatureMeshes";
import { BoxGeometry, MeshBasicMaterial } from "three";


export default function useFeatureMeshes() {
  return useContext(FeatureMeshesContext);
}

export type FeatureMeshesContextValue = {
  featureMeshes: PreloadedFeatureMeshes | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
};

type FeatureMeshesCtxProviderProps = {
  omit?: string[];
}

export const FeatureMeshesContext = createContext<FeatureMeshesContextValue>({
  featureMeshes: null,
  loading: true,
  error: null,
  refetch: () => {},
});

type UseFeatureMeshesInternalProps = FeatureMeshesCtxProviderProps;

const DEFAULT_OMIT: string[] = [];

export function useFeatureMeshesInternal({ omit = DEFAULT_OMIT }: UseFeatureMeshesInternalProps) {
  const [featureMeshes, setFeatureMeshes] = useState<FeatureMeshesContextValue["featureMeshes"]>({
    Fallback: {
      name: "Fallback",
      geometry: new BoxGeometry(1, 1, 1),
      material: new MeshBasicMaterial({ color: "red" }),
    },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function doIt() {
      console.log("doIt....", omit);
      const meshes = await preloadFeatureMeshes({ omit })
      setFeatureMeshes((prev) => ({ ...prev, ...meshes }));
      setLoading(false);
      setError(null);
    }

    doIt();
  }, []);

  const refetch = useCallback(() => {
    async function doIt() {
      setLoading(false);
      const meshes = await preloadFeatureMeshes({ omit })
      setFeatureMeshes((prev) => ({ ...prev, ...meshes }));
      setLoading(false);
      setError(null);
    }

    doIt();
  }, []);

  return useMemo(() => ({
    featureMeshes,
    loading,
    error,
    refetch,
  }), [featureMeshes, loading, error, refetch]);
}