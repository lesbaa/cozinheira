import { useFeatureMeshesInternal, FeatureMeshesContext } from "./useFeatureMeshes";

export function FeatureMeshesCtxProvider({ children }: { children: React.ReactNode }) {
  const value = useFeatureMeshesInternal({ omit: [] });
  return <FeatureMeshesContext.Provider value={value}>{children}</FeatureMeshesContext.Provider>;
}
