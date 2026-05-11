import React, { useState, useCallback } from "react";
import { Outlet, useLocation } from "react-router-dom";
import NewHeader from "./NewHeader";
import SecondaryNav from "./SecondaryNav";
import HomeSubNav from "@/components/HomePage/HomeSubNav";
import Footer from "./Footer";
import { LayoutContext } from "@/contexts/LayoutContext";

const Layout: React.FC = () => {
  const { pathname } = useLocation();
  const [hideFooter, setHideFooterState] = useState(false);
  const setHideFooter = useCallback((hide: boolean) => {
    setHideFooterState(hide);
  }, []);

  return (
    <LayoutContext.Provider value={{ hideFooter, setHideFooter }}>
      <div className="min-h-screen flex flex-col">
        <NewHeader />
        <div className="relative z-[40]">
          {pathname === "/" ? <HomeSubNav /> : <SecondaryNav />}
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
