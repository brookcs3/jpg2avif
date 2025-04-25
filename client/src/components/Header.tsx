import { Github } from "lucide-react";
import { siteConfig } from "../config";

const Header = () => {
  return (
    <nav className="bg-white shadow-blue-lg border-b border-blue-100">
      <div 
        className="bg-gradient-to-r from-white to-blue-50"
        style={{
          background: `linear-gradient(to right, white, ${siteConfig.accentColor}10)`
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex-shrink-0 flex items-center">
              <div className="h-10 w-10 p-1.5 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 shadow-blue flex items-center justify-center">
                <svg 
                  className="h-7 w-7" 
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 24 24" 
                  fill="white"
                  aria-hidden="true"
                >
                  <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm0-2a8 8 0 100-16 8 8 0 000 16zM10.622 8.415l4.879 2.616c.449.264.449.69 0 .949l-4.879 2.616c-.478.265-.97.03-.97-.44v-5.3c0-.47.492-.705.97-.44z"/>
                </svg>
              </div>
              <span className="ml-2 text-xl font-bold gradient-text">
                {siteConfig.logoText}
              </span>
            </div>
            <div className="flex items-center">
              <a 
                href="https://github.com/brookcs3/aviflip" 
                className="text-blue-600 hover:text-blue-800 transition-colors p-2 rounded-full hover:bg-blue-50" 
                target="_blank" 
                rel="noopener noreferrer"
                aria-label="GitHub Repository"
              >
                <Github className="h-6 w-6" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Header;
