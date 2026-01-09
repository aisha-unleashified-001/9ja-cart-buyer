import React from "react";
import { Link, Outlet } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Image } from "../UI/Image";
import { registerImg } from "../../assets/auth";

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
          {/* Back to home link */}
          <Link
            to="/"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to homepage
          </Link>

          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
