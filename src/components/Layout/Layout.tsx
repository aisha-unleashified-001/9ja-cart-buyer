import React from "react";
import { Outlet } from "react-router-dom";
import NewHeader from "./NewHeader";
import SecondaryNav from "./SecondaryNav";
import Footer from "./Footer";

const Layout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <NewHeader />
      <div className="">
        <SecondaryNav />
      </div>
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
