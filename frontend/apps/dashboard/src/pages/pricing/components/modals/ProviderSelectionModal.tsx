import { 
  Badge, 
  Button, 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle, 
  Label, 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@workspace/ui";
import { 
  AlertCircle, 
  CheckCircle2, 
  Globe, 
  Settings, 
  Zap 
} from "lucide-react";
import React from "react";
import { MarkupConfigurationModalProps } from "../../types";

// Provider information with status and capabilities
const PROVIDERS = {
  MAYA: {
    name: "Maya",
    description: "Primary eSIM provider with global coverage",
    status: "active",
    coverage: "Global",
    reliability: "99.9%",
    icon: <Zap className="h-4 w-4" />,
    color: "bg-green-100 border-green-300 text-green-800"
  },
  ESIM_GO: {
    name: "eSIM Go",
    description: "Backup provider with extensive regional coverage",
    status: "active", 
    coverage: "Regional",
    reliability: "99.5%",
    icon: <Globe className="h-4 w-4" />,
    color: "bg-blue-100 border-blue-300 text-blue-800"
  },
  AIRALO: {
    name: "Airalo",
    description: "Alternative provider for specific regions",
    status: "maintenance",
    coverage: "Limited",
    reliability: "98.8%",
    icon: <Settings className="h-4 w-4" />,
    color: "bg-orange-100 border-orange-300 text-orange-800"
  }
} as const;

type ProviderKey = keyof typeof PROVIDERS;

const ProviderSelectionModal: React.FC<MarkupConfigurationModalProps> = ({
  tempConfig,
  setTempConfig,
}) => {
  const preferredProvider = tempConfig.preferredProvider || "MAYA";
  const fallbackProvider = tempConfig.fallbackProvider || "ESIM_GO";

  const updateProviderConfig = (field: string, value: ProviderKey) => {
    setTempConfig({
      ...tempConfig,
      [field]: value,
    });
  };

  const getProviderStatus = (providerKey: ProviderKey) => {
    const provider = PROVIDERS[providerKey];
    const isActive = provider.status === "active";
    
    return {
      icon: isActive ? <CheckCircle2 className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />,
      color: isActive ? "text-green-600" : "text-orange-600",
      text: isActive ? "Active" : "Maintenance"
    };
  };

  const ProviderCard: React.FC<{ 
    providerKey: ProviderKey; 
    isSelected: boolean; 
    role: "preferred" | "fallback";
    onSelect: () => void;
  }> = ({ providerKey, isSelected, role, onSelect }) => {
    const provider = PROVIDERS[providerKey];
    const status = getProviderStatus(providerKey);
    
    return (
      <Card 
        className={`cursor-pointer transition-all ${
          isSelected 
            ? "ring-2 ring-blue-500 border-blue-300" 
            : "hover:border-gray-400"
        }`}
        onClick={onSelect}
      >
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {provider.icon}
              <CardTitle className="text-sm font-medium">
                {provider.name}
              </CardTitle>
            </div>
            <div className="flex items-center gap-1">
              {status.icon}
              <span className={`text-xs ${status.color}`}>
                {status.text}
              </span>
            </div>
          </div>
          <CardDescription className="text-xs">
            {provider.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Coverage:</span>
              <span className="font-medium">{provider.coverage}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Reliability:</span>
              <span className="font-medium">{provider.reliability}</span>
            </div>
            {isSelected && (
              <Badge 
                variant="secondary" 
                className="text-xs px-2 py-1 mt-2"
              >
                Selected as {role}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-slate-600" />
          <h3 className="text-lg font-medium text-gray-900">
            Provider Selection Configuration
          </h3>
        </div>
        <p className="text-sm text-gray-600">
          Configure primary and backup eSIM providers for bundle provisioning. 
          This block runs first (priority 100) to determine provider routing.
        </p>
      </div>

      {/* Preferred Provider Section */}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-gray-700">
          Preferred Provider
        </Label>
        <p className="text-xs text-gray-500 mb-3">
          Primary provider used for eSIM provisioning when available.
        </p>
        
        <Select 
          value={preferredProvider} 
          onValueChange={(value: ProviderKey) => updateProviderConfig("preferredProvider", value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(PROVIDERS).map(([key, provider]) => (
              <SelectItem key={key} value={key}>
                <div className="flex items-center gap-2">
                  {provider.icon}
                  <span>{provider.name}</span>
                  <Badge 
                    variant={provider.status === "active" ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {provider.status}
                  </Badge>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
          {Object.entries(PROVIDERS).map(([key, provider]) => (
            <ProviderCard
              key={key}
              providerKey={key as ProviderKey}
              isSelected={preferredProvider === key}
              role="preferred"
              onSelect={() => updateProviderConfig("preferredProvider", key as ProviderKey)}
            />
          ))}
        </div>
      </div>

      {/* Fallback Provider Section */}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-gray-700">
          Fallback Provider
        </Label>
        <p className="text-xs text-gray-500 mb-3">
          Backup provider used when the preferred provider is unavailable.
        </p>
        
        <Select 
          value={fallbackProvider} 
          onValueChange={(value: ProviderKey) => updateProviderConfig("fallbackProvider", value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(PROVIDERS)
              .filter(([key]) => key !== preferredProvider) // Don't allow same as preferred
              .map(([key, provider]) => (
                <SelectItem key={key} value={key}>
                  <div className="flex items-center gap-2">
                    {provider.icon}
                    <span>{provider.name}</span>
                    <Badge 
                      variant={provider.status === "active" ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {provider.status}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
          </SelectContent>
        </Select>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
          {Object.entries(PROVIDERS)
            .filter(([key]) => key !== preferredProvider)
            .map(([key, provider]) => (
              <ProviderCard
                key={key}
                providerKey={key as ProviderKey}
                isSelected={fallbackProvider === key}
                role="fallback"
                onSelect={() => updateProviderConfig("fallbackProvider", key as ProviderKey)}
              />
            ))}
        </div>
      </div>

      {/* Configuration Preview */}
      <div className="space-y-2 pt-4 border-t border-gray-200">
        <Label className="text-sm font-medium text-gray-700">
          Configuration Preview
        </Label>
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Block Priority:</span>
              <Badge variant="outline" className="text-xs">
                100 (Highest - Runs First)
              </Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Event Type:</span>
              <code className="text-xs bg-white px-2 py-1 rounded border">
                select_provider
              </code>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Preferred Provider:</span>
              <div className="flex items-center gap-1">
                {PROVIDERS[preferredProvider as ProviderKey].icon}
                <span className="font-medium">
                  {PROVIDERS[preferredProvider as ProviderKey].name}
                </span>
                {getProviderStatus(preferredProvider as ProviderKey).icon}
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Fallback Provider:</span>
              <div className="flex items-center gap-1">
                {PROVIDERS[fallbackProvider as ProviderKey].icon}
                <span className="font-medium">
                  {PROVIDERS[fallbackProvider as ProviderKey].name}
                </span>
                {getProviderStatus(fallbackProvider as ProviderKey).icon}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Usage Information */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-2">
          <CheckCircle2 className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="text-blue-800 font-medium mb-1">
              How Provider Selection Works
            </p>
            <ul className="text-blue-700 text-xs space-y-1">
              <li>• This block always runs first (priority 100) in the strategy</li>
              <li>• It determines which provider to use for eSIM provisioning</li>
              <li>• If preferred provider is unavailable, fallback is used automatically</li>
              <li>• Provider status is checked in real-time during execution</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProviderSelectionModal;