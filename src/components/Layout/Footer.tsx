import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Linkedin, Send } from 'lucide-react';
import { Button } from '../UI/Button';
import logoImage from '../../assets/logo.png';

const Footer: React.FC = () => {
  const [email, setEmail] = useState('');

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle subscription logic here
    console.log('Subscribing email:', email);
    setEmail('');
  };

  return (
    <footer className="bg-[#182F38] text-white">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 mb-8 sm:mb-12">
          {/* Know Us More */}
          <div>
            <h3 className="text-lg font-semibold mb-6 text-white">Know Us More</h3>
            <ul className="space-y-3 text-sm">
              <li><Link to="/careers" className="text-gray-300 hover:text-white transition-colors">Careers</Link></li>
              <li><Link to="/blog" className="text-gray-300 hover:text-white transition-colors">Blog</Link></li>
              <li><Link to="/about" className="text-gray-300 hover:text-white transition-colors">About Us</Link></li>
              <li><Link to="/terms" className="text-gray-300 hover:text-white transition-colors">Terms & Conditions (T's & C's)</Link></li>
              <li><Link to="/contact" className="text-gray-300 hover:text-white transition-colors">Contact</Link></li>
            </ul>
          </div>

          {/* Make Money With Us */}
          <div>
            <h3 className="text-lg font-semibold mb-6 text-white">Make Money With Us</h3>
            <ul className="space-y-3 text-sm">
              <li><Link to="/sell" className="text-gray-300 hover:text-white transition-colors">Sell Products on 9Jacart</Link></li>
              <li><Link to="/advertise" className="text-gray-300 hover:text-white transition-colors">Advertise Your Product</Link></li>
              <li><Link to="/affiliate" className="text-gray-300 hover:text-white transition-colors">Become an Affiliate</Link></li>
            </ul>
          </div>

          {/* 9Jacart Payment Options */}
          <div>
            <h3 className="text-lg font-semibold mb-6 text-white">9Jacart Payment Options</h3>
            <ul className="space-y-3 text-sm">
              <li><span className="text-gray-300">Bank Payments (Visa, MasterCard)</span></li>
              <li><span className="text-gray-300">Buy Now, Pay Later (BNPL)</span></li>
              <li><span className="text-gray-300">Pay on Delivery</span></li>
              <li><span className="text-gray-300">Emergency Credit</span></li>
            </ul>
          </div>

          {/* Let Us Help You */}
          <div>
            <h3 className="text-lg font-semibold mb-6 text-white">Let Us Help You</h3>
            <ul className="space-y-3 text-sm">
              <li><Link to="/account" className="text-gray-300 hover:text-white transition-colors">Your Account</Link></li>
              <li><Link to="/orders" className="text-gray-300 hover:text-white transition-colors">Your Orders</Link></li>
              <li><Link to="/returns" className="text-gray-300 hover:text-white transition-colors">Returns & Replacements</Link></li>
              <li><Link to="/help" className="text-gray-300 hover:text-white transition-colors">Help</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 lg:gap-8 border-t border-gray-600 pt-6 lg:pt-8">
          {/* Logo and Subscribe */}
          <div className="lg:col-span-1">
            <div className="flex items-center mb-4">
              <img src={logoImage} alt="9ja-cart" className="h-8 w-auto" />
            </div>
            <h4 className="text-white font-semibold mb-4">Subscribe</h4>
            <p className="text-sm text-gray-300 mb-4">Get 10% off your first order</p>
            <form onSubmit={handleSubscribe} className="flex">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="flex-1 px-3 py-2 bg-transparent border border-gray-500 rounded-l-md text-white placeholder-gray-400 focus:outline-none focus:border-[#8DEB6E] text-sm"
                required
              />
              <Button
                type="submit"
                className="bg-transparent border border-gray-500 border-l-0 rounded-l-none rounded-r-md px-3 hover:bg-gray-700"
                size="sm"
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-white font-semibold mb-4">Support</h4>
            <div className="space-y-2 text-sm text-gray-300">
              <p>No2 Buhari Estate,</p>
              <p>Kobape Road, GRA</p>
              <p>Abeokuta, Ogun.</p>
              <p className="mt-3">9jacart@gmail.com</p>
              <p>+234-8105558696</p>
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
              <li><Link to="/products" className="text-gray-300 hover:text-white transition-colors">Shop</Link></li>
            </ul>
          </div>

          {/* Quick Link */}
          <div>
            <h4 className="text-white font-semibold mb-4">Quick Link</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/privacy" className="text-gray-300 hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="text-gray-300 hover:text-white transition-colors">Terms Of Use</Link></li>
              <li><Link to="/faq" className="text-gray-300 hover:text-white transition-colors">FAQ</Link></li>
              <li><Link to="/contact" className="text-gray-300 hover:text-white transition-colors">Contact</Link></li>
            </ul>
          </div>

          {/* Download App */}
          <div>
            <h4 className="text-white font-semibold mb-4">Download App</h4>
            <p className="text-xs text-gray-300 mb-4">Save ₦1,500 with App New User Only</p>
            
            {/* QR Code and App Store Links */}
            <div className="flex items-start gap-3 mb-6">
              {/* QR Code Placeholder */}
              <div className="w-16 h-16 bg-white rounded border-2 border-gray-300 flex items-center justify-center">
                <div className="w-12 h-12 bg-gray-800 rounded grid grid-cols-3 gap-px">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <div key={i} className={`${i % 2 === 0 ? 'bg-white' : 'bg-gray-800'} rounded-sm`}></div>
                  ))}
                </div>
              </div>
              
              {/* App Store Buttons */}
              <div className="space-y-2">
                <div className="bg-black rounded px-4 py-2 text-sm text-white border border-gray-600 touch-target-sm">
                  <div className="text-[10px] text-gray-300">GET IT ON</div>
                  <div className="font-semibold">Google Play</div>
                </div>
                <div className="bg-black rounded px-4 py-2 text-sm text-white border border-gray-600 touch-target-sm">
                  <div className="text-[10px] text-gray-300">Download on the</div>
                  <div className="font-semibold">App Store</div>
                </div>
              </div>
            </div>

            {/* Social Media Icons */}
            <div className="flex gap-4">
              <a href="#" className="text-gray-300 hover:text-white transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-300 hover:text-white transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-300 hover:text-white transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-300 hover:text-white transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-gray-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-sm text-gray-400">
            © Copyright 2025. All right reserved
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;