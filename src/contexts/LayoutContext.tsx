import React, { createContext, useContext } from "react";

export type LayoutContextValue = {
  hideFooter: boolean;
  setHideFooter: (hide: boolean) => void;
};

const LayoutContext = createContext<LayoutContextValue>({
  hideFooter: false,
  setHideFooter: () => {},
});

export const useLayoutContext = () => useContext(LayoutContext);
export { LayoutContext };
