import React, { useState, useCallback } from "react";
import { Outlet } from "react-router-dom";
import NewHeader from "./NewHeader";
import SecondaryNav from "./SecondaryNav";
import Footer from "./Footer";
import { LayoutContext } from "@/contexts/LayoutContext";

const Layout: React.FC = () => {
  const [hideFooter, setHideFooterState] = useState(false);
  const setHideFooter = useCallback((hide: boolean) => {
    setHideFooterState(hide);
  }, []);

  return (
    <LayoutContext.Provider value={{ hideFooter, setHideFooter }}>
      <div className="min-h-screen flex flex-col">
        <NewHeader />
        <div className="relative z-[40]">
          <SecondaryNav />
        </div>
        <main className="flex-1  ">
          <Outlet />
        </main>
        {!hideFooter && <Footer />}
      </div>
    </LayoutContext.Provider>
  );
};

export default Layout;
