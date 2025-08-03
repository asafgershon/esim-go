import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@workspace/ui';
import { Calculator, Layers, Settings, Globe, Workflow } from 'lucide-react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';





const PricingPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Tab configuration with titles, icons, descriptions, and routes
  const tabConfig = {
    '/pricing/summary': {
      title: 'Summary',
      icon: <Layers className="h-5 w-5" />,
      description: 'View and manage pricing configurations across all countries and bundles'
    },
    '/pricing/rules': {
      title: 'Rules Management',
      icon: <Settings className="h-5 w-5" />,
      description: 'Comprehensive pricing rule management including system rules, markup configuration, and processing fees'
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
      description: 'Build and manage pricing strategies with visual flow builder'
    }
  };

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
            <Link
              to="/pricing/summary"
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                currentPath === '/pricing/summary'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Layers className="h-4 w-4" />
              Summary
            </Link>
            <Link
              to="/pricing/rules"
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                currentPath === '/pricing/rules'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Settings className="h-4 w-4" />
              Rules
            </Link>
            <Link
              to="/pricing/simulator"
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                currentPath === '/pricing/simulator'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Calculator className="h-4 w-4" />
              Simulator Pricing
            </Link>
            <Link
              to="/pricing/airhalo"
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                currentPath === '/pricing/airhalo'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Globe className="h-4 w-4" />
              AirHalo Pricing
            </Link>
            <Link
              to="/pricing/strategy"
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                currentPath === '/pricing/strategy'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Workflow className="h-4 w-4" />
              Strategy
            </Link>
          </div>

          {/* Mobile Dropdown - shown on mobile and tablet, hidden on desktop */}
          <div className="md:hidden">
            <Select value={currentPath} onValueChange={(value) => navigate(value)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a view" />
              </SelectTrigger>
            <SelectContent>
              <SelectItem value="/pricing/summary">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4" />
                  <span>Summary</span>
                </div>
              </SelectItem>
              <SelectItem value="/pricing/rules">
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  <span>Rules</span>
                </div>
              </SelectItem>
              <SelectItem value="/pricing/simulator">
                <div className="flex items-center gap-2">
                  <Calculator className="h-4 w-4" />
                  <span>Simulator Pricing</span>
                </div>
              </SelectItem>
              <SelectItem value="/pricing/airhalo">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  <span>AirHalo Pricing</span>
                </div>
              </SelectItem>
              <SelectItem value="/pricing/strategy">
                <div className="flex items-center gap-2">
                  <Workflow className="h-4 w-4" />
                  <span>Strategy</span>
                </div>
              </SelectItem>
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