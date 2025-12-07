"use client";

import { Button } from "@/components/ui/button";
import { Menu, Search, X, User, LogOut } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

interface NavbarProps {
  showSearch?: boolean;
}

const Navbar = ({ showSearch = false }: NavbarProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { user, logout } = useAuth();

  return (
    <nav className="bg-[#121212] border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <h1 className="text-xl font-bold text-white">
              <Link href="/">
                <span className="font-oxanium">Quantum</span>
              </Link>
            </h1>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              <Link
                href="/news-feed"
                className="text-white hover:text-gray-300 transition-colors duration-200"
              >
                News Feed
              </Link>
              <Link
                href="/market-finance"
                className="text-white hover:text-gray-300 transition-colors duration-200"
              >
                Market & Finance
              </Link>
              <Link
                href="/chatbot"
                className="text-white hover:text-gray-300 transition-colors duration-200"
              >
                Chatbot
              </Link>
              <Link
                href="/about"
                className="text-white hover:text-gray-300 transition-colors duration-200"
              >
                About
              </Link>
            </div>
          </div>

          {/* Search and Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {showSearch && (
              <>
                {!isSearchOpen ? (
                  <Search
                    className="h-5 w-5 text-gray-400 hover:text-white cursor-pointer transition-colors duration-200"
                    onClick={() => setIsSearchOpen(true)}
                  />
                ) : (
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      placeholder="Search..."
                      className="bg-transparent text-white px-3 py-1 rounded-md border border-gray-600 focus:outline-none focus:border-white transition-colors duration-200"
                      autoFocus
                      onBlur={() => setIsSearchOpen(false)}
                      onKeyDown={(e) => {
                        if (e.key === "Escape") {
                          setIsSearchOpen(false);
                        }
                      }}
                    />
                    <X
                      className="h-4 w-4 text-gray-400 hover:text-white cursor-pointer transition-colors duration-200"
                      onClick={() => setIsSearchOpen(false)}
                    />
                  </div>
                )}
              </>
            )}

            {user ? (
              <div className="flex items-center space-x-3">
                <Link href="/profile">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="hover:bg-zinc-800 transition-all duration-200 cursor-pointer"
                  >
                    <User className="h-5 w-5 text-white" />
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={logout}
                  className="hover:bg-zinc-800 transition-all duration-200 cursor-pointer"
                >
                  <LogOut className="h-5 w-5 text-white" />
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                className="border-white text-white cursor-pointer hover:bg-white hover:text-black transition-all duration-200 bg-transparent"
              >
                <Link href="/auth">Login</Link>
              </Button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-white hover:text-gray-300"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-[#121212] border-t border-gray-800">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link
              href="/news-feed"
              className="block px-3 py-2 text-white hover:text-gray-300"
            >
              News Feed
            </Link>
            <Link
              href="/market-finance"
              className="block px-3 py-2 text-white hover:text-gray-300"
            >
              Market & Finance
            </Link>
            <Link
              href="/chatbot"
              className="block px-3 py-2 text-white hover:text-gray-300"
            >
              Chatbot
            </Link>
            <Link
              href="/about"
              className="block px-3 py-2 text-white hover:text-gray-300"
            >
              About
            </Link>
            <div className="flex space-x-2 px-3 py-2">
              {user ? (
                <>
                  <Link href="/profile">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-white text-white bg-transparent cursor-pointer"
                    >
                      <User className="h-4 w-4 mr-2" />
                      Profile
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={logout}
                    className="border-white text-white bg-transparent cursor-pointer"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
                </>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="border-white text-white bg-transparent cursor-pointer"
                >
                  <Link href="/auth">Login</Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
