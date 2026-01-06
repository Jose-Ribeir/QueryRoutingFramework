'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

interface NavLink {
  id: string;
  label: string;
  isRoute?: boolean;
  subItems?: { id: string; label: string }[];
}

const navLinks: NavLink[] = [
  { id: 'hero', label: 'Home' },
  { id: 'challenge-solution', label: 'Challenge & Solution' },
  { id: 'technical-deep-dive', label: 'Technical Deep Dive' },
  { id: 'methodology', label: 'Methodology' },
  { id: 'results-data', label: 'Results & Data' },
  { id: 'resources-author', label: 'Resources & Author' },
  { id: 'presentation', label: 'Presentation', isRoute: true },
  { id: 'downloads', label: 'Downloads', isRoute: true },
];

// Styling constants for better organization
const navStyles = {
  // Navigation bar
  navBar: {
    base: 'fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-in-out',
    background: 'bg-ppt-dark2/95 backdrop-blur-md',
    scrolled: {
      shadow: 'shadow-2xl shadow-black/50',
      border: 'border-b-2 border-ppt-accent4/40',
    },
    default: {
      shadow: 'shadow-xl shadow-black/30',
      border: 'border-b-2 border-ppt-light1/20',
    },
  },
  // Button states
  button: {
    base: 'relative px-4 lg:px-5 py-2.5 text-sm font-semibold transition-all duration-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ppt-accent4/50 focus:ring-offset-2 focus:ring-offset-ppt-dark2',
    default: 'text-ppt-light1/80',
    active: 'text-ppt-light1 bg-ppt-accent4 shadow-lg shadow-ppt-accent4/30 neon-glow-blue',
    hover: 'hover:bg-ppt-accent4/20 hover:text-ppt-light1',
    route: 'text-ppt-light1/90 hover:text-ppt-light1 hover:bg-ppt-accent4/20',
  },
  // Mobile menu
  mobile: {
    base: 'block px-4 py-3 mx-2 rounded-lg text-sm font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-ppt-accent4/50 focus:ring-inset',
    default: 'text-ppt-light1/90 hover:text-ppt-light1 hover:bg-ppt-accent4/20',
    active: 'text-ppt-light1 bg-ppt-accent4/30 shadow-md shadow-ppt-accent4/20',
    hover: 'hover:translate-x-1',
  },
};

export default function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const scrollToSection = useCallback((id: string) => {
    // Function to perform the actual scroll
    const performScroll = () => {
      const element = document.getElementById(id);
      if (element) {
        const offset = 80; // Account for fixed navbar
        
        // Get the element's position relative to the document
        const rect = element.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const elementTop = rect.top + scrollTop;
        const targetPosition = elementTop - offset;

        // Scroll directly to the calculated position
        window.scrollTo({
          top: Math.max(0, targetPosition),
          behavior: 'smooth',
        });
        
        // Update active section after scroll completes
        setTimeout(() => {
          setActiveSection(id);
        }, 300);
        
        // Update URL hash without triggering scroll
        if (window.history.pushState) {
          window.history.pushState(null, '', `#${id}`);
        }
        return true;
      }
      return false;
    };

    // Try immediately first
    if (performScroll()) {
      return;
    }

    // If element not found, wait a bit and try again
    const tryScroll = (attempts: number = 5, delay: number = 100) => {
      if (attempts <= 0) {
        console.warn(`Element with id "${id}" not found after multiple attempts`);
        // Fallback: try scrolling to hash
        window.location.hash = id;
        return;
      }

      setTimeout(() => {
        if (!performScroll()) {
          tryScroll(attempts - 1, delay);
        }
      }, delay);
    };

    // Start trying to scroll
    tryScroll();
  }, []);

  useEffect(() => {
    // Only track active sections when on the home page
    if (pathname !== '/') {
      setActiveSection('');
      return;
    }

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);

      // Update active section based on scroll position
      const allSectionIds = navLinks
        .filter(link => !link.isRoute)
        .map(link => link.id);
      const sections = allSectionIds.map(id => document.getElementById(id));
      const scrollPosition = window.scrollY + 100;

      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i];
        if (section && section.offsetTop <= scrollPosition) {
          setActiveSection(allSectionIds[i]);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial check

    return () => window.removeEventListener('scroll', handleScroll);
  }, [pathname]);

  // Handle hash navigation when page loads or pathname changes
  useEffect(() => {
    if (pathname === '/' && typeof window !== 'undefined') {
      const hash = window.location.hash.slice(1); // Remove the # symbol
      if (hash) {
        // Wait for page to render, then scroll to section
        setTimeout(() => {
          scrollToSection(hash);
        }, 300);
      }
    } else {
      // Clear active section when navigating away from home page
      setActiveSection('');
    }
  }, [pathname, scrollToSection]);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    // If we're not on the home page, navigate to home page with hash first
    if (pathname !== '/') {
      router.push(`/#${id}`);
      // Wait for navigation, then scroll
      setTimeout(() => {
        scrollToSection(id);
      }, 300);
    } else {
      // We're on the home page, just scroll to the section
      setTimeout(() => {
        scrollToSection(id);
      }, 50);
    }
  };

  return (
    <nav
      className={`${navStyles.navBar.base} ${navStyles.navBar.background} ${
        isScrolled
          ? `${navStyles.navBar.scrolled.shadow} ${navStyles.navBar.scrolled.border}`
          : `${navStyles.navBar.default.shadow} ${navStyles.navBar.default.border}`
      }`}
    >
      {/* Subtle gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-r from-ppt-accent4/5 via-transparent to-ppt-accent6/5 pointer-events-none" />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="flex items-center justify-between h-18 md:h-20">
          {/* Logo/Title */}
          <a
            href="#hero"
            onClick={(e) => handleClick(e, 'hero')}
            className="group relative text-sm md:text-base lg:text-lg xl:text-xl font-bold transition-all duration-300 max-w-xs md:max-w-md lg:max-w-lg xl:max-w-2xl truncate text-ppt-light1 hover:text-ppt-accent4"
            title="Query Routing Framework"
          >
            <span className="relative z-10 transition-transform duration-300 group-hover:scale-105 inline-block">
              Query Routing Framework
            </span>
            <span className="absolute bottom-0 left-0 h-0.5 w-0 transition-all duration-300 bg-ppt-accent4 group-hover:w-full" />
          </a>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {navLinks.map((link, index) => {
              if (link.isRoute) {
                const isRouteActive = pathname === `/${link.id}`;
                return (
                  <Link
                    key={link.id}
                    href={`/${link.id}`}
                    className={`${navStyles.button.base} ${
                      isRouteActive
                        ? `${navStyles.button.active}`
                        : `${navStyles.button.route}`
                    }`}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <span className="relative z-10">{link.label}</span>
                  </Link>
                );
              }
              
              const isActive = pathname === '/' && activeSection === link.id;
              return (
                <a
                  key={link.id}
                  href={`#${link.id}`}
                  onClick={(e) => handleClick(e, link.id)}
                  className={`${navStyles.button.base} ${
                    isActive
                      ? `${navStyles.button.active}`
                      : `${navStyles.button.default} ${navStyles.button.hover}`
                  }`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <span className="relative z-10">{link.label}</span>
                </a>
              );
            })}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden relative p-2.5 rounded-lg transition-all duration-300 text-ppt-light1 hover:bg-ppt-accent4/20 active:bg-ppt-accent4/30 focus:outline-none focus:ring-2 focus:ring-ppt-accent4/50"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
            aria-expanded={isMobileMenuOpen}
          >
            <div className="relative w-6 h-6">
              <span
                className={`absolute top-1/2 left-1/2 w-5 h-0.5 transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 bg-ppt-light1 ${
                  isMobileMenuOpen ? 'rotate-45 translate-y-0' : '-translate-y-1.5'
                }`}
              />
              <span
                className={`absolute top-1/2 left-1/2 w-5 h-0.5 transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 bg-ppt-light1 ${
                  isMobileMenuOpen ? 'opacity-0' : 'opacity-100'
                }`}
              />
              <span
                className={`absolute top-1/2 left-1/2 w-5 h-0.5 transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 bg-ppt-light1 ${
                  isMobileMenuOpen ? '-rotate-45 translate-y-0' : 'translate-y-1.5'
                }`}
              />
            </div>
          </button>
        </div>

        {/* Mobile menu */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-500 ease-in-out ${
            isMobileMenuOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="py-4 mt-2 pt-4 border-t border-ppt-light1/20">
            {navLinks.map((link, index) => {
              if (link.isRoute) {
                const isRouteActive = pathname === `/${link.id}`;
                return (
                  <Link
                    key={link.id}
                    href={`/${link.id}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`${navStyles.mobile.base} ${navStyles.mobile.hover} ${
                      isRouteActive ? navStyles.mobile.active : navStyles.mobile.default
                    }`}
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    {link.label}
                    {isRouteActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full bg-ppt-accent4 shadow-sm shadow-ppt-accent4/50" />
                    )}
                  </Link>
                );
              }
              
              const isActive = pathname === '/' && activeSection === link.id;
              return (
                <a
                  key={link.id}
                  href={`#${link.id}`}
                  onClick={(e) => {
                    handleClick(e, link.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`${navStyles.mobile.base} ${navStyles.mobile.hover} relative ${
                    isActive
                      ? navStyles.mobile.active
                      : navStyles.mobile.default
                  }`}
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  {link.label}
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full bg-ppt-accent4 shadow-sm shadow-ppt-accent4/50" />
                  )}
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}

