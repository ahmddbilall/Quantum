const Footer = () => {
  return (
    <footer className="bg-[#121212] border-t border-gray-800 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-2xl font-bold text-white mb-4">
              <span className="font-oxanium">Quantum</span>
            </h3>
            <p className="text-gray-400 mb-6">
              Your AI-powered gateway to understanding the world through news.
            </p>
            <div className="flex space-x-4">
              <div className="w-8 h-8 border border-white rounded-full flex items-center justify-center hover:bg-white hover:text-black transition-all duration-200 cursor-pointer">
                <span className="text-xs font-bold">f</span>
              </div>
              <div className="w-8 h-8 border border-white rounded-full flex items-center justify-center hover:bg-white hover:text-black transition-all duration-200 cursor-pointer">
                <span className="text-xs font-bold">t</span>
              </div>
              <div className="w-8 h-8 border border-white rounded-full flex items-center justify-center hover:bg-white hover:text-black transition-all duration-200 cursor-pointer">
                <span className="text-xs font-bold">in</span>
              </div>
            </div>
          </div>
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">Company</h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors duration-200"
                >
                  About
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors duration-200"
                >
                  Contact
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors duration-200"
                >
                  Careers
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">Legal</h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors duration-200"
                >
                  Privacy Policy
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors duration-200"
                >
                  Terms of Service
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors duration-200"
                >
                  Cookie Policy
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-8 text-center">
          <p className="text-gray-500 text-sm">
            © 2025 <span className="font-oxanium">Quantum</span>. All rights
            reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
