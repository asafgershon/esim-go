import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@workspace/ui';
import { Calculator, Layers, Settings, Globe, Workflow } from 'lucide-react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';





const PricingPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Check if we're in production
  const isProduction = import.meta.env.PROD;

  // Tab configuration with titles, icons, descriptions, and routes
  const allTabs = {
    '/pricing/summary': {
      title: 'Summary',
      icon: <Layers className="h-5 w-5" />,
      description: 'View and manage pricing configurations across all countries and bundles'
    },
    '/pricing/rules': {
      title: 'Rules Management',
      icon: <Settings className="h-5 w-5" />,
      description: 'Comprehensive pricing rule management including system rules, markup configuration, and processing fees',
      hideInProduction: true
    },
    '/pricing/simulator': {
      title: 'Simulator Pricing',
      icon: <Calculator className="h-5 w-5" />,
      description: 'Simulate pricing for any country and duration combination'
    },
    '/pricing/airhalo': {
      title: 'AirHalo Pricing',
      icon: <Globe className="h-5 w-5" />,
      description: 'View and compare AirHalo competitor pricing data across different packages and countries'
    },
    '/pricing/strategy': {
      title: 'Strategy',
      icon: <Workflow className="h-5 w-5" />,
      description: 'Build and manage pricing strategies with visual flow builder',
      hideInProduction: true
    }
  };

  // Filter tabs based on environment
  const tabConfig = Object.fromEntries(
    Object.entries(allTabs).filter(([_, tab]) => !isProduction || !tab.hideInProduction)
  ) as typeof allTabs;

  // Get current tab based on route, default to summary
  const currentPath = location.pathname === '/pricing' ? '/pricing/summary' : location.pathname;
  const currentTab = tabConfig[currentPath as keyof typeof tabConfig] || tabConfig['/pricing/summary'];

  return (
    <div className="h-full flex flex-col">
      {/* Fixed Header Section */}
      <div className="flex-shrink-0 space-y-4 pb-4">
        {/* Active tab header */}
        <div className="flex justify-between items-center">
          <div className="flex flex-col gap-1">
            {/* Small top title - very tight spacing */}
            <h1 className="text-sm font-normal text-gray-500 leading-none">Pricing Management</h1>
            <div className="flex items-center gap-3">
              {currentTab.icon}
              <h2 className="text-2xl font-bold text-gray-900">{currentTab.title}</h2>
            </div>
            <p className="text-gray-600">{currentTab.description}</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div>
          {/* Desktop Tabs - hidden on mobile, shown on desktop */}
          <div className="hidden md:flex space-x-1 bg-muted p-1 rounded-lg w-fit">
            {Object.entries(tabConfig).map(([path, tab]) => {
              const Icon = tab.icon.type;
              const title = tab.title.replace(' Management', '').replace(' Pricing', '');
              return (
                <Link
                  key={path}
                  to={path}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                    currentPath === path
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab.icon}
                  {title}
                </Link>
              );
            })}
          </div>

          {/* Mobile Dropdown - shown on mobile and tablet, hidden on desktop */}
          <div className="md:hidden">
            <Select value={currentPath} onValueChange={(value) => navigate(value)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a view" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(tabConfig).map(([path, tab]) => {
                  const title = tab.title.replace(' Management', '').replace(' Pricing', '');
                  return (
                    <SelectItem key={path} value={path}>
                      <div className="flex items-center gap-2">
                        {tab.icon}
                        <span>{title}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Separator between tabs and content */}
        <div className="flex justify-center">
          <div className="w-3/4 h-px bg-gray-200"></div>
        </div>
      </div>

      {/* Flexible Content Area */}
      <div className="flex-1 min-h-0">
        <Outlet />
      </div>
    </div>
  );
};

export default PricingPage;