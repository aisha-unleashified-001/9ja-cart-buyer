// import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Linkedin, MapPinCheck, Phone, Mail } from 'lucide-react';
// import { Button } from '../UI/Button';
import logoImage from '../../assets/logo.png';

const Footer: React.FC = () => {
  // const [email, setEmail] = useState('');

  // const handleSubscribe = (e: React.FormEvent) => {
  //   e.preventDefault();
  //   // Handle subscription logic here
  //   console.log('Subscribing email:', email);
  //   setEmail('');
  // };

  return (
    <footer className="bg-[#182F38] text-white">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 mb-8 sm:mb-12">
          {/* Know Us More */}
          <div>
            <h3 className="text-lg font-semibold mb-6 text-white">Know Us More</h3>
            <ul className="space-y-3 text-sm">
              {/* <li><Link to="/careers" className="text-gray-300 hover:text-white transition-colors">Careers</Link></li> */}
              {/* <li><Link to="/blog" className="text-gray-300 hover:text-white transition-colors">Blog</Link></li> */}
              <li><Link to="/about" className="text-gray-300 hover:text-white transition-colors">About Us</Link></li>
              <li><Link to="/terms" className="text-gray-300 hover:text-white transition-colors">Terms & Conditions (T's & C's)</Link></li>
              <li><Link to="/contact-admin" className="text-gray-300 hover:text-white transition-colors">Contact Admin</Link></li>
            </ul>
          </div>

          {/* Make Money With Us */}
          <div>
            <h3 className="text-lg font-semibold mb-6 text-white">Make Money With Us</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <a
                  href="https://9ja-cart-selle.vercel.app/sell-product"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Sell Products on 9Jacart
                </a>
              </li>
              {/* <li><Link to="/advertise" className="text-gray-300 hover:text-white transition-colors">Advertise Your Product</Link></li>
              <li><Link to="/affiliate" className="text-gray-300 hover:text-white transition-colors">Become an Affiliate</Link></li> */}
            </ul>
            
            {/* Let Us Help You */}
            <h3 className="text-lg font-semibold mb-6 text-white mt-8">Let Us Help You</h3>
            <ul className="space-y-3 text-sm">
              <li><Link to="/contact-admin" className="text-gray-300 hover:text-white transition-colors">Help (Contact Admin)</Link></li>
            </ul>
          </div>

          {/* 9Jacart Payment Options */}
          <div>
            <h3 className="text-lg font-semibold mb-6 text-white">9Jacart Payment Options</h3>
            <ul className="space-y-3 text-sm">
              <li><span className="text-gray-300">Bank Payments (Visa, MasterCard)</span></li>
              <li><span className="text-gray-300">Buy Now, Pay Later (Coming Soon)</span></li>
              <li><span className="text-gray-300">Pay on Delivery (Coming Soon)</span></li>
              <li><span className="text-gray-300">Emergency Credit (Coming Soon)</span></li>
            </ul>
          </div>

        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 border-t border-gray-600 pt-6 lg:pt-8">
          {/* Logo, Contact Info & Social Media */}
          <div className="lg:col-span-1">
            <div className="flex items-center mb-4">
              <img src={logoImage} alt="9ja-cart" className="h-8 w-auto" />
            </div>
            <div className="text-sm text-gray-300 space-y-2">
              <p className="flex items-start gap-2">
                <MapPinCheck className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>1, Oregun Way. Ikeja. Lagos State</span>
              </p>
              <p className="flex items-start gap-2">
                <Phone className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>07055559966</span>
              </p>
              <p className="flex items-start gap-2">
                <Phone className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>07054449966</span>
              </p>
              <p className="flex items-start gap-2">
                <Mail className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>info@9jacarts.com</span>
              </p>
            </div>
            {/* Social Media Icons */}
            <div className="flex gap-4 mt-4">
              <a href="#" className="text-gray-300 hover:text-white transition-colors" aria-label="Facebook">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-300 hover:text-white transition-colors" aria-label="Twitter">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-300 hover:text-white transition-colors" aria-label="Instagram">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-300 hover:text-white transition-colors" aria-label="LinkedIn">
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>


          {/* Account */}
          <div>
            <h4 className="text-white font-semibold mb-4">Account</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/account" className="text-gray-300 hover:text-white transition-colors">My Account</Link></li>
              <li><Link to="/auth/login" className="text-gray-300 hover:text-white transition-colors">Login / Register</Link></li>
              <li><Link to="/cart" className="text-gray-300 hover:text-white transition-colors">Cart</Link></li>
              <li><Link to="/wishlist" className="text-gray-300 hover:text-white transition-colors">Wishlist</Link></li>
              {/* <li><Link to="/products" className="text-gray-300 hover:text-white transition-colors">Shop</Link></li> */}
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              {/* <li><Link to="/privacy" className="text-gray-300 hover:text-white transition-colors">Privacy Policy</Link></li> */}
              {/* <li><Link to="/terms-of-use" className="text-gray-300 hover:text-white transition-colors">Terms Of Use</Link></li> */}
              <li><Link to="/shipping-return-policy" className="text-gray-300 hover:text-white transition-colors">Shipping and return policy</Link></li>
              <li><Link to="/refund-policy" className="text-gray-300 hover:text-white transition-colors">Refund Policy</Link></li>
              <li><Link to="/dispute-policy" className="text-gray-300 hover:text-white transition-colors">Dispute Policy</Link></li>
            </ul>
          </div>

        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-gray-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-sm text-gray-400">
            © Copyright {new Date().getFullYear()}. All right reserved
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;