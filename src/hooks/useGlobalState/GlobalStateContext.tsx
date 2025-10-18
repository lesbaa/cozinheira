import { GlobalStateContext, useGlobalStateInternal } from "./useGlobalState";

export function GlobalStateCtxProvider({ children }: { children: React.ReactNode }) {
  const ctxValue = useGlobalStateInternal();
  return (
    <GlobalStateContext.Provider value={ctxValue}>
      {children}
    </GlobalStateContext.Provider>
  );
}