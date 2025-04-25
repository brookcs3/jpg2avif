import { Github, Image } from "lucide-react";
import { siteConfig } from "../config";

const Header = () => {
  return (
    <nav className="bg-gradient-to-r from-blue-800 to-blue-600 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex-shrink-0 flex items-center">
            <div className="p-1.5 bg-white rounded-full shadow-inner">
              <Image 
                className="h-7 w-7" 
                color={siteConfig.primaryColor}
                strokeWidth={2.5}
                aria-hidden="true"
              />
            </div>
            <span className="ml-2.5 text-2xl font-extrabold tracking-tight" style={{ 
              background: `linear-gradient(to right, ${siteConfig.accentColor}, white)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0px 1px 1px rgba(0,0,0,0.1)'
            }}>
              {siteConfig.logoText}
            </span>
            <span className="ml-2 text-xs text-blue-200 font-medium">converter</span>
          </div>
          <div className="flex items-center">
            <a 
              href="https://github.com/brookcs3/aviflip" 
              className="text-blue-100 hover:text-white transition-colors" 
              target="_blank" 
              rel="noopener noreferrer"
              aria-label="GitHub Repository"
            >
              <Github className="h-6 w-6" />
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Header;
