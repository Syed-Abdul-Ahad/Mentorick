import React from 'react';
import { Link } from 'react-router-dom';
import BrandLogo from './BrandLogo';
import {
  FaCcVisa,
  FaCcMastercard,
  FaCcAmex,
  FaCcPaypal,
  FaCcApplePay,
  FaGooglePay,
} from "react-icons/fa";

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <BrandLogo className="h-12 w-auto object-contain" />
            </div>
            <p className="text-gray-400 text-sm">
              World-class wisdom, Accessibly yours. Connecting ambitious
              individuals with world-class mentors for transformative 1:1 guidance.
            </p>
          </div>

          <div>
            <h2 className="font-semibold mb-4 text-base">Company</h2>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <Link to="/our-why" className="hover:text-white">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/mentor-signup" className="hover:text-white">
                  Become a Mentor
                </Link>
              </li>
              <li>
                <Link to="/mentors" className="hover:text-white">
                  Find Mentors
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="font-semibold mb-4 text-base">Support</h2>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <Link to="/contact" className="hover:text-white">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-white">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-white">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="font-semibold mb-4 text-base">Explore</h2>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <Link to="/" className="hover:text-white">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/mentors" className="hover:text-white">
                  Search Mentors
                </Link>
              </li>
              <li>
                <Link to="/our-why" className="hover:text-white">
                  Our Why
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            <div className="text-center sm:text-left">
              <p className="text-sm text-gray-400">&copy; {new Date().getFullYear()} Mentorick. All rights reserved.</p>
            </div>
            
            <div className="flex flex-col items-center sm:items-end">
              <p className="text-sm text-gray-400 mb-3">Secure payments with</p>
              <div className="flex items-center space-x-2" aria-hidden="true">
                <FaCcVisa className="h-6 w-8 text-gray-400" />
                <FaCcMastercard className="h-6 w-8 text-gray-400" />
                <FaCcAmex className="h-6 w-8 text-gray-400" />
                <FaCcPaypal className="h-6 w-8 text-gray-400" />
                <FaCcApplePay className="h-6 w-8 text-gray-400" />
                <FaGooglePay className="h-6 w-8 text-gray-400" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
