import React from "react";
import { Link, Outlet } from "react-router-dom";
import { Image } from "../UI/Image";
import { registerImg } from "../../assets/auth";
import logoImage from "../../assets/logo.png";

const AuthLayout: React.FC = () => {
  const authImage = registerImg;
  return (
    <div className="min-h-screen flex">
      {/* Left side - Image/Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative">
        {/* Background Image */}
        <Image
          src={authImage}
          alt="E-commerce shopping experience"
          className="absolute inset-0 w-full h-full"
          objectFit="cover"
          lazy={false}
        />

        {/* Overlay */}
        <div className="absolute inset-0 bg-black opacity-20" />
      </div>

      {/* Right side - Auth Form */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-lg">
          {/* Logo - Back to home */}
          <div className="flex justify-center mb-12">
            <Link
              to="/"
              className="transition-opacity hover:opacity-80"
            >
              <img src={logoImage} alt="9ja-cart" className="h-10 w-auto" />
            </Link>
          </div>

          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
