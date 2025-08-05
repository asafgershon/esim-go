import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Card, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Button, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Switch } from '@workspace/ui';
import { useQuery, useMutation } from '@apollo/client';
import { 
  GET_PRICING_FILTERS, 
  GET_COUPONS, 
  GET_CORPORATE_EMAIL_DOMAINS,
  CREATE_COUPON,
  UPDATE_COUPON,
  DELETE_COUPON,
  TOGGLE_COUPON,
  CREATE_CORPORATE_EMAIL_DOMAIN,
  UPDATE_CORPORATE_EMAIL_DOMAIN,
  DELETE_CORPORATE_EMAIL_DOMAIN,
  TOGGLE_CORPORATE_EMAIL_DOMAIN
} from '@/lib/graphql/queries';
import { 
  Calculator, 
  DollarSign, 
  Percent, 
  TrendingUp, 
  CreditCard,
  Target,
  Globe,
  Plus,
  Trash2,
  ChevronRight,
  Settings,
  Edit2,
  Check,
  X,
  Pencil,
  Loader,
  AlertTriangle,
  Tag,
  Calendar,
  Users,
  Building,
  Eye,
  EyeOff,
  Copy,
  BarChart3
} from 'lucide-react';

interface Block {
  id: string;
  type: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  params?: Record<string, any>;
}

interface StrategyStep extends Block {
  uniqueId: string;
  config?: {
    [key: string]: any;
  };
}

const availableBlocks: Block[] = [
  {
    id: 'discount',
    type: 'discount',
    name: 'Discount',
    description: 'Apply percentage or fixed discount',
    icon: <Percent className="h-4 w-4" />,
    color: 'bg-green-100 border-green-300 text-green-800',
  },
  {
    id: 'markup',
    type: 'markup',
    name: 'Markup',
    description: 'Add markup to base price',
    icon: <TrendingUp className="h-4 w-4" />,
    color: 'bg-blue-100 border-blue-300 text-blue-800',
  },
  {
    id: 'fixed-price',
    type: 'fixed-price',
    name: 'Fixed Price',
    description: 'Set a fixed price for the bundle',
    icon: <DollarSign className="h-4 w-4" />,
    color: 'bg-purple-100 border-purple-300 text-purple-800',
  },
  {
    id: 'processing-fee',
    type: 'processing-fee',
    name: 'Processing Fee',
    description: 'Calculate payment processing fees',
    icon: <CreditCard className="h-4 w-4" />,
    color: 'bg-orange-100 border-orange-300 text-orange-800',
  },
  {
    id: 'keep-profit',
    type: 'keep-profit',
    name: 'Keep Profit',
    description: 'Maintain minimum profit margin',
    icon: <Target className="h-4 w-4" />,
    color: 'bg-red-100 border-red-300 text-red-800',
  },
  {
    id: 'psychological-rounding',
    type: 'psychological-rounding',
    name: 'Psychological Rounding',
    description: 'Apply charm pricing (e.g., $9.99)',
    icon: <Calculator className="h-4 w-4" />,
    color: 'bg-indigo-100 border-indigo-300 text-indigo-800',
  },
  {
    id: 'region-rounding',
    type: 'region-rounding',
    name: 'Region Rounding',
    description: 'Apply region-specific rounding rules',
    icon: <Globe className="h-4 w-4" />,
    color: 'bg-teal-100 border-teal-300 text-teal-800',
  },
  {
    id: 'coupon',
    type: 'coupon',
    name: 'Coupon',
    description: 'Manage discount coupons and corporate domains',
    icon: <Tag className="h-4 w-4" />,
    color: 'bg-amber-100 border-amber-300 text-amber-800',
  },
];

// Markup Configuration Modal Component
interface MarkupConfigurationModalProps {
  tempConfig: { [key: string]: any };
  setTempConfig: (config: { [key: string]: any }) => void;
}

const MarkupConfigurationModal: React.FC<MarkupConfigurationModalProps> = ({ 
  tempConfig, 
  setTempConfig 
}) => {
  const { data, loading, error } = useQuery(GET_PRICING_FILTERS);

  // Add console logging for debugging
  React.useEffect(() => {
    console.log('MarkupConfigurationModal - Query state:', { data, loading, error });
    if (data) {
      console.log('Pricing filters data:', data.pricingFilters);
      console.log('Groups:', data.pricingFilters?.groups);
      console.log('Durations:', data.pricingFilters?.durations);
    }
    if (error) {
      console.error('GraphQL Error details:', error);
      console.error('Error message:', error.message);
      console.error('Network error:', error.networkError);
      console.error('GraphQL errors:', error.graphQLErrors);
    }
  }, [data, loading, error]);

  const groups = data?.pricingFilters?.groups || [];
  const durations = data?.pricingFilters?.durations || [];

  // Initialize group-duration configurations if not already set
  React.useEffect(() => {
    if (groups.length && durations.length && !tempConfig.groupDurationConfigs) {
      const initialConfigs: { [key: string]: { [key: string]: { markupValue: number } } } = {};
      
      groups.forEach((group: string) => {
        initialConfigs[group] = {};
        durations.forEach((duration: any) => {
          initialConfigs[group][duration.value] = {
            markupValue: tempConfig.markupValue || 5
          };
        });
      });
      
      setTempConfig({ 
        ...tempConfig, 
        groupDurationConfigs: initialConfigs 
      });
    }
  }, [groups, durations, tempConfig, setTempConfig]);

  const updateGroupDurationConfig = (group: string, duration: string, field: string, value: any) => {
    const newConfigs = { ...tempConfig.groupDurationConfigs };
    if (!newConfigs[group]) {
      newConfigs[group] = {};
    }
    if (!newConfigs[group][duration]) {
      newConfigs[group][duration] = { markupValue: tempConfig.markupValue || 5 };
    }
    newConfigs[group][duration][field] = value;
    setTempConfig({ ...tempConfig, groupDurationConfigs: newConfigs });
  };

  const applyToAll = (field: string, value: any) => {
    const newConfigs = { ...tempConfig.groupDurationConfigs };
    groups.forEach((group: string) => {
      durations.forEach((duration: any) => {
        if (!newConfigs[group]) newConfigs[group] = {};
        if (!newConfigs[group][duration.value]) {
          newConfigs[group][duration.value] = { markupValue: tempConfig.markupValue || 5 };
        }
        newConfigs[group][duration.value][field] = value;
      });
    });
    setTempConfig({ ...tempConfig, groupDurationConfigs: newConfigs });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader className="h-6 w-6 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading configuration data...</span>
      </div>
    );
  }

  if (error) {
    console.error('GraphQL Error:', error);
    return (
      <div className="space-y-4 py-8">
        <div className="flex items-center justify-center text-red-600">
          <AlertTriangle className="h-6 w-6 mr-2" />
          <span>Error loading configuration data: {error.message}</span>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-4">Using default configuration instead.</p>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              // Initialize with some default data
              const defaultGroups = ['Standard Fixed', 'Standard Unlimited Lite', 'Standard Unlimited Essential'];
              const defaultDurations = [
                { value: '1', label: '1 day', minDays: 1, maxDays: 1 },
                { value: '3', label: '3 days', minDays: 3, maxDays: 3 },
                { value: '5', label: '5 days', minDays: 5, maxDays: 5 },
                { value: '7', label: '7 days', minDays: 7, maxDays: 7 },
                { value: '10', label: '10 days', minDays: 10, maxDays: 10 },
                { value: '15', label: '15 days', minDays: 15, maxDays: 15 },
                { value: '21', label: '21 days', minDays: 21, maxDays: 21 },
                { value: '30', label: '30 days', minDays: 30, maxDays: 30 }
              ];
              
              const initialConfigs: { [key: string]: { [key: string]: { markupValue: number } } } = {};
              defaultGroups.forEach((group: string) => {
                initialConfigs[group] = {};
                defaultDurations.forEach((duration: any) => {
                  initialConfigs[group][duration.value] = {
                    markupValue: tempConfig.markupValue || 5
                  };
                });
              });
              
              setTempConfig({ 
                ...tempConfig, 
                groupDurationConfigs: initialConfigs 
              });
            }}
          >
            Use Default Configuration
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Global Markup Settings */}
      <div className="space-y-4 pb-4 border-b border-gray-200">
        <h4 className="font-medium text-gray-900">Global Settings</h4>
        
        <div className="space-y-2">
          <Label>Default Markup Amount ($)</Label>
          <Input
            type="number"
            step="0.01"
            value={tempConfig.markupValue || 0}
            onChange={(e) => setTempConfig({ ...tempConfig, markupValue: parseFloat(e.target.value) || 0 })}
          />
          <p className="text-xs text-gray-500">This will be the default markup applied to all bundles</p>
        </div>
      </div>

      {/* Group-Duration Configuration Matrix */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-gray-900">Group & Duration Configuration</h4>
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => applyToAll('markupValue', tempConfig.markupValue || 5)}
            >
              Apply Default to All
            </Button>
          </div>
        </div>

        {groups.length === 0 || durations.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">No groups or durations available.</p>
            <p className="text-xs mt-1">Default markup will be applied to all bundles.</p>
          </div>
        ) : (
          <div className="border border-gray-300 rounded-sm overflow-x-auto bg-white" style={{ maxHeight: '400px' }}>
            <table className="w-full border-collapse" style={{ minWidth: '800px' }}>
              <thead className="sticky top-0 z-20">
                <tr>
                  <th className="border border-gray-300 bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-700 text-left sticky left-0 z-30" style={{ minWidth: '200px' }}>
                    Group / Duration
                  </th>
                  {durations.length > 0 ? durations.map((duration: any) => (
                    <th key={duration.value} className="border border-gray-300 bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-700 text-center" style={{ minWidth: '100px' }}>
                      {duration.value} {duration.value === 1 ? 'day' : 'days'}
                    </th>
                  )) : (
                    // Default columns if no durations loaded - using the exact durations: 1, 3, 5, 7, 10, 15, 21, 30
                    [1, 3, 5, 7, 10, 15, 21, 30].map(days => (
                      <th key={days} className="border border-gray-300 bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-700 text-center" style={{ minWidth: '100px' }}>
                        {days} {days === 1 ? 'day' : 'days'}
                      </th>
                    ))
                  )}
                </tr>
              </thead>
              <tbody>
                {groups.length > 0 ? groups.map((group: string) => (
                  <tr key={group}>
                    <td className="border border-gray-300 bg-gray-50 px-3 py-2 text-xs font-medium text-gray-900 sticky left-0 z-10">
                      {group}
                    </td>
                    {durations.length > 0 ? durations.map((duration: any) => {
                      const config = tempConfig.groupDurationConfigs?.[group]?.[duration.value] || { markupValue: tempConfig.markupValue || 5 };
                      return (
                        <td key={duration.value} className="border border-gray-300 px-1 py-1">
                          <input
                            type="number"
                            step="0.01"
                            value={config.markupValue || ''}
                            onChange={(e) => updateGroupDurationConfig(
                              group, 
                              duration.value, 
                              'markupValue', 
                              parseFloat(e.target.value) || 0
                            )}
                            className="w-full text-center text-xs py-1 px-1 border-0 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-transparent"
                            style={{ minHeight: '24px' }}
                            placeholder="0"
                          />
                        </td>
                      );
                    }) : (
                      // Default columns if no durations loaded
                      [1, 3, 5, 7, 10, 15, 21, 30].map(days => (
                        <td key={days} className="border border-gray-300 px-1 py-1">
                          <input
                            type="number"
                            step="0.01"
                            value=""
                            onChange={(e) => {}}
                            className="w-full text-center text-xs py-1 px-1 border-0 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-transparent"
                            style={{ minHeight: '24px' }}
                            placeholder="0"
                          />
                        </td>
                      ))
                    )}
                  </tr>
                )) : (
                  // Default rows if no groups loaded
                  ['Standard Fixed', 'Standard Unlimited Lite', 'Standard Unlimited Essential'].map(group => (
                    <tr key={group}>
                      <td className="border border-gray-300 bg-gray-50 px-3 py-2 text-xs font-medium text-gray-900 sticky left-0 z-10">
                        {group}
                      </td>
                      {[1, 3, 5, 7, 10, 15, 21, 30].map(days => (
                        <td key={days} className="border border-gray-300 px-1 py-1">
                          <input
                            type="number"
                            step="0.01"
                            value=""
                            onChange={(e) => {}}
                            className="w-full text-center text-xs py-1 px-1 border-0 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-transparent"
                            style={{ minHeight: '24px' }}
                            placeholder="0"
                          />
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Preview Section */}
      <div className="space-y-2 pt-4 border-t border-gray-200">
        <Label className="text-sm font-medium text-gray-700">Configuration Preview</Label>
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-xs space-y-1 text-blue-800">
            <p><strong>Type:</strong> Fixed Amount</p>
            <p><strong>Default Markup:</strong> ${tempConfig.markupValue || 0}</p>
            {tempConfig.groupDurationConfigs && Object.keys(tempConfig.groupDurationConfigs).length > 0 && (
              <p><strong>Custom Configs:</strong> {groups.length} group(s) × {durations.length} duration(s)</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

// Coupon Configuration Modal Component
interface CouponConfigurationModalProps {
  tempConfig: { [key: string]: any };
  setTempConfig: (config: { [key: string]: any }) => void;
}

const CouponConfigurationModal: React.FC<CouponConfigurationModalProps> = ({
  tempConfig,
  setTempConfig
}) => {
  const [activeTab, setActiveTab] = useState<'coupons' | 'corporate'>('coupons');
  const [editingCoupon, setEditingCoupon] = useState<any>(null);
  const [editingDomain, setEditingDomain] = useState<any>(null);
  const [showCreateCoupon, setShowCreateCoupon] = useState(false);
  const [showCreateDomain, setShowCreateDomain] = useState(false);

  // GraphQL hooks
  const { data: couponsData, loading: couponsLoading, refetch: refetchCoupons } = useQuery(GET_COUPONS, {
    variables: { filter: { isActive: true } }
  });
  const { data: domainsData, loading: domainsLoading, refetch: refetchDomains } = useQuery(GET_CORPORATE_EMAIL_DOMAINS);

  const [createCoupon] = useMutation(CREATE_COUPON);
  const [updateCoupon] = useMutation(UPDATE_COUPON);
  const [deleteCoupon] = useMutation(DELETE_COUPON);
  const [toggleCoupon] = useMutation(TOGGLE_COUPON);

  const [createDomain] = useMutation(CREATE_CORPORATE_EMAIL_DOMAIN);
  const [updateDomain] = useMutation(UPDATE_CORPORATE_EMAIL_DOMAIN);
  const [deleteDomain] = useMutation(DELETE_CORPORATE_EMAIL_DOMAIN);
  const [toggleDomain] = useMutation(TOGGLE_CORPORATE_EMAIL_DOMAIN);

  const coupons = couponsData?.coupons || [];
  const domains = domainsData?.corporateEmailDomains || [];

  const formatDate = (dateString: string) => {
    if (!dateString) return 'No limit';
    return new Date(dateString).toLocaleDateString();
  };

  const getUsageText = (coupon: any) => {
    const used = coupon.usageStats?.totalUsages || 0;
    const total = coupon.maxTotalUsage || 'unlimited';
    return `${used}/${total}`;
  };

  const handleCreateCoupon = async (couponData: any) => {
    try {
      await createCoupon({ variables: { input: couponData } });
      refetchCoupons();
      setShowCreateCoupon(false);
    } catch (error) {
      console.error('Error creating coupon:', error);
    }
  };

  const handleUpdateCoupon = async (id: string, couponData: any) => {
    try {
      await updateCoupon({ variables: { id, input: couponData } });
      refetchCoupons();
      setEditingCoupon(null);
    } catch (error) {
      console.error('Error updating coupon:', error);
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    if (confirm('Are you sure you want to delete this coupon?')) {
      try {
        await deleteCoupon({ variables: { id } });
        refetchCoupons();
      } catch (error) {
        console.error('Error deleting coupon:', error);
      }
    }
  };

  const handleToggleCoupon = async (id: string) => {
    try {
      await toggleCoupon({ variables: { id } });
      refetchCoupons();
    } catch (error) {
      console.error('Error toggling coupon:', error);
    }
  };

  const handleCreateDomain = async (domainData: any) => {
    try {
      await createDomain({ variables: { input: domainData } });
      refetchDomains();
      setShowCreateDomain(false);
    } catch (error) {
      console.error('Error creating domain:', error);
    }
  };

  const handleUpdateDomain = async (id: string, domainData: any) => {
    try {
      await updateDomain({ variables: { id, input: domainData } });
      refetchDomains();
      setEditingDomain(null);
    } catch (error) {
      console.error('Error updating domain:', error);
    }
  };

  const handleDeleteDomain = async (id: string) => {
    if (confirm('Are you sure you want to delete this corporate domain?')) {
      try {
        await deleteDomain({ variables: { id } });
        refetchDomains();
      } catch (error) {
        console.error('Error deleting domain:', error);
      }
    }
  };

  const handleToggleDomain = async (id: string) => {
    try {
      await toggleDomain({ variables: { id } });
      refetchDomains();
    } catch (error) {
      console.error('Error toggling domain:', error);
    }
  };

  return (
    <>
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('coupons')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'coupons'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Tag className="w-4 h-4 inline mr-2" />
            Discount Coupons
          </button>
          <button
            onClick={() => setActiveTab('corporate')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'corporate'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Building className="w-4 h-4 inline mr-2" />
            Corporate Domains
          </button>
        </nav>
      </div>

      {/* Coupons Tab */}
      {activeTab === 'coupons' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="font-medium text-gray-900">Manage Discount Coupons</h4>
            <Button
              onClick={() => setShowCreateCoupon(true)}
              size="sm"
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Coupon
            </Button>
          </div>

          {couponsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader className="h-6 w-6 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Loading coupons...</span>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {coupons.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Tag className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-sm">No coupons found. Create your first coupon to get started.</p>
                </div>
              ) : (
                coupons.map((coupon: any) => (
                  <Card key={coupon.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                              {coupon.code}
                            </code>
                            {coupon.isActive ? (
                              <Eye className="w-4 h-4 text-green-600" />
                            ) : (
                              <EyeOff className="w-4 h-4 text-red-600" />
                            )}
                          </div>
                          <div className="text-sm text-gray-600">
                            {coupon.couponType === 'percentage' ? `${coupon.value}% off` : `$${coupon.value} off`}
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Valid: {formatDate(coupon.validFrom)} - {formatDate(coupon.validUntil)}
                        </div>
                        <div className="text-xs text-gray-500 flex items-center gap-4 mt-1">
                          <span>Usage: {getUsageText(coupon)}</span>
                          {coupon.minSpend && <span>Min spend: ${coupon.minSpend}</span>}
                          {coupon.maxDiscount && <span>Max discount: ${coupon.maxDiscount}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingCoupon(coupon)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleToggleCoupon(coupon.id)}
                        >
                          {coupon.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteCoupon(coupon.id)}
                          className="text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* Corporate Domains Tab */}
      {activeTab === 'corporate' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="font-medium text-gray-900">Corporate Email Domains</h4>
            <Button
              onClick={() => setShowCreateDomain(true)}
              size="sm"
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Domain
            </Button>
          </div>

          {domainsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader className="h-6 w-6 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Loading domains...</span>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {domains.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Building className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-sm">No corporate domains configured. Add domains to provide automatic discounts.</p>
                </div>
              ) : (
                domains.map((domain: any) => (
                  <Card key={domain.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                              @{domain.domain}
                            </code>
                            {domain.isActive ? (
                              <Eye className="w-4 h-4 text-green-600" />
                            ) : (
                              <EyeOff className="w-4 h-4 text-red-600" />
                            )}
                          </div>
                          <div className="text-sm text-gray-600">
                            {domain.discountPercentage}% off
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 flex items-center gap-4 mt-1">
                          {domain.minSpend && <span>Min spend: ${domain.minSpend}</span>}
                          {domain.maxDiscount && <span>Max discount: ${domain.maxDiscount}</span>}
                          <span>Usage: {domain.usageStats?.totalUsages || 0} users</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingDomain(domain)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleToggleDomain(domain.id)}
                        >
                          {domain.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteDomain(domain.id)}
                          className="text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* Configuration Summary */}
      <div className="space-y-2 pt-4 border-t border-gray-200">
        <Label className="text-sm font-medium text-gray-700">Coupon System Status</Label>
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-xs space-y-1 text-blue-800">
            <p><strong>Active Coupons:</strong> {coupons.filter((c: any) => c.isActive).length}</p>
            <p><strong>Corporate Domains:</strong> {domains.filter((d: any) => d.isActive).length}</p>
            <p><strong>Total Usage:</strong> {coupons.reduce((acc: number, c: any) => acc + (c.usageStats?.totalUsages || 0), 0)} redemptions</p>
          </div>
        </div>
      </div>

      {/* Create/Edit Coupon Modal would go here */}
      {/* Create/Edit Domain Modal would go here */}
    </>
  );
};

const StrategyPage: React.FC = () => {
  const [strategySteps, setStrategySteps] = useState<StrategyStep[]>([]);
  const [selectedStep, setSelectedStep] = useState<string | null>(null);
  const [strategyName, setStrategyName] = useState<string>('New Strategy #1');
  const [strategyDescription, setStrategyDescription] = useState<string>('Add a description for your pricing strategy...');
  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [isEditingDescription, setIsEditingDescription] = useState<boolean>(false);
  const [editingStep, setEditingStep] = useState<StrategyStep | null>(null);
  const [tempConfig, setTempConfig] = useState<{ [key: string]: any }>({});

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const { source, destination } = result;

    if (source.droppableId === 'available-blocks' && destination.droppableId === 'strategy-flow') {
      // Adding a new block to the strategy
      const block = availableBlocks.find(b => b.id === result.draggableId);
      if (block) {
        const newStep: StrategyStep = {
          ...block,
          uniqueId: `${block.id}-${Date.now()}`,
        };
        const newSteps = [...strategySteps];
        newSteps.splice(destination.index, 0, newStep);
        setStrategySteps(newSteps);
      }
    } else if (source.droppableId === 'strategy-flow' && destination.droppableId === 'strategy-flow') {
      // Reordering within the strategy
      const newSteps = Array.from(strategySteps);
      const [removed] = newSteps.splice(source.index, 1);
      newSteps.splice(destination.index, 0, removed);
      setStrategySteps(newSteps);
    }
  };

  const removeStep = (uniqueId: string) => {
    setStrategySteps(steps => steps.filter(step => step.uniqueId !== uniqueId));
    if (selectedStep === uniqueId) {
      setSelectedStep(null);
    }
  };

  const openEditModal = (step: StrategyStep) => {
    setEditingStep(step);
    setTempConfig(step.config || getDefaultConfig(step.type));
  };

  const getDefaultConfig = (type: string): { [key: string]: any } => {
    switch (type) {
      case 'discount':
        return {
          type: 'percentage',
          value: 10,
          condition: 'always',
          minDays: 7,
        };
      case 'markup':
        return {
          markupType: 'fixed',
          markupValue: 5,
          groupDurationConfigs: {} // Will be populated based on groups and durations
        };
      case 'fixed-price':
        return {
          basePrice: 0,
          currency: 'USD',
        };
      case 'processing-fee':
        return {
          paymentMethod: 'card',
          feePercentage: 2.9,
          fixedFee: 0.30,
        };
      case 'keep-profit':
        return {
          minProfit: 15,
          type: 'percentage',
        };
      case 'psychological-rounding':
        return {
          strategy: 'charm',
          roundTo: 0.99,
        };
      case 'region-rounding':
        return {
          region: 'us',
          roundingRule: 'nearest-dollar',
        };
      case 'coupon':
        return {
          enableCoupons: true,
          enableCorporateDiscounts: true,
          activeCoupons: 0,
          corporateDomains: 0,
        };
      default:
        return {};
    }
  };

  const saveStepConfig = () => {
    if (!editingStep) return;
    
    setStrategySteps(steps => 
      steps.map(step => 
        step.uniqueId === editingStep.uniqueId 
          ? { ...step, config: tempConfig }
          : step
      )
    );
    setEditingStep(null);
    setTempConfig({});
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="h-full flex gap-4">
        {/* Left Sidebar - Available Blocks */}
        <div className="w-80 flex-shrink-0 bg-gray-50 border-r border-gray-200 overflow-y-auto">
          <div className="p-4">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Available Blocks
            </h3>
            
            <Droppable droppableId="available-blocks" isDropDisabled={true}>
              {(provided) => (
                <div 
                  {...provided.droppableProps} 
                  ref={provided.innerRef}
                  className="space-y-2"
                >
                  {availableBlocks.map((block, index) => (
                    <Draggable 
                      key={block.id} 
                      draggableId={block.id} 
                      index={index}
                    >
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          style={{
                            ...provided.draggableProps.style,
                            transform: snapshot.isDragging 
                              ? provided.draggableProps.style?.transform 
                              : 'none',
                          }}
                        >
                          <Card className={`p-3 cursor-move transition-all hover:shadow-md ${block.color} border-2 ${
                            snapshot.isDragging ? 'opacity-50' : ''
                          }`}>
                            <div className="flex items-start gap-3">
                              <div className="mt-0.5">{block.icon}</div>
                              <div className="flex-1">
                                <h4 className="font-medium text-sm">{block.name}</h4>
                                <p className="text-xs opacity-75 mt-1">{block.description}</p>
                              </div>
                            </div>
                          </Card>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>

            <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-700">
                <strong>Tip:</strong> Drag blocks to the right to build your pricing strategy. 
                The blocks will be executed in order from top to bottom.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column - Strategy Flow Builder */}
        <div className="flex-1 overflow-y-auto bg-white p-6">
          <div className="max-w-4xl mx-auto">
            {/* Editable Strategy Name */}
            <div className="mb-2">
              {isEditingName ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={strategyName}
                    onChange={(e) => setStrategyName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') setIsEditingName(false);
                      if (e.key === 'Escape') {
                        setStrategyName('New Strategy #1');
                        setIsEditingName(false);
                      }
                    }}
                    className="text-2xl font-bold border-2 border-blue-500 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                  <button
                    onClick={() => setIsEditingName(false)}
                    className="p-1 hover:bg-green-100 rounded text-green-600"
                  >
                    <Check className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => {
                      setStrategyName('New Strategy #1');
                      setIsEditingName(false);
                    }}
                    className="p-1 hover:bg-red-100 rounded text-red-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              ) : (
                <h2 
                  className="text-2xl font-bold inline-flex items-center gap-2 cursor-pointer hover:bg-gray-50 rounded px-2 py-1 -ml-2"
                  onClick={() => setIsEditingName(true)}
                >
                  {strategyName}
                  <Edit2 className="h-4 w-4 text-gray-400" />
                </h2>
              )}
            </div>

            {/* Editable Strategy Description */}
            <div className="mb-6">
              {isEditingDescription ? (
                <div className="flex items-start gap-2">
                  <textarea
                    value={strategyDescription}
                    onChange={(e) => setStrategyDescription(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        setStrategyDescription('Add a description for your pricing strategy...');
                        setIsEditingDescription(false);
                      }
                    }}
                    className="flex-1 text-gray-600 border-2 border-blue-500 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[60px] resize-none"
                    autoFocus
                  />
                  <button
                    onClick={() => setIsEditingDescription(false)}
                    className="p-1 hover:bg-green-100 rounded text-green-600"
                  >
                    <Check className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => {
                      setStrategyDescription('Add a description for your pricing strategy...');
                      setIsEditingDescription(false);
                    }}
                    className="p-1 hover:bg-red-100 rounded text-red-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              ) : (
                <p 
                  className="text-gray-600 cursor-pointer hover:bg-gray-50 rounded px-2 py-1 -ml-2 inline-flex items-center gap-2"
                  onClick={() => setIsEditingDescription(true)}
                >
                  {strategyDescription}
                  <Edit2 className="h-3 w-3 text-gray-400" />
                </p>
              )}
            </div>
            
            <Droppable droppableId="strategy-flow">
              {(provided, snapshot) => (
                <div 
                  {...provided.droppableProps} 
                  ref={provided.innerRef}
                  className={`min-h-[400px] p-4 border-2 border-dashed rounded-lg transition-colors ${
                    snapshot.isDraggingOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300'
                  }`}
                >
                  {strategySteps.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-96 text-gray-400">
                      <Plus className="h-12 w-12 mb-4" />
                      <p className="text-lg font-medium">Start building your strategy</p>
                      <p className="text-sm mt-2">Drag blocks from the left sidebar here</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {strategySteps.map((step, index) => (
                        <React.Fragment key={step.uniqueId}>
                          {index > 0 && (
                            <div className="flex justify-center">
                              <ChevronRight className="h-5 w-5 text-gray-400 rotate-90" />
                            </div>
                          )}
                          
                          <Draggable draggableId={step.uniqueId} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`group relative ${snapshot.isDragging ? 'z-50' : ''}`}
                              >
                                <Card className={`p-4 cursor-move transition-all ${
                                  selectedStep === step.uniqueId 
                                    ? 'ring-2 ring-blue-500 shadow-lg' 
                                    : 'hover:shadow-md'
                                } ${step.color} border-2 ${
                                  snapshot.isDragging ? 'opacity-50 rotate-2' : ''
                                }`}>
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <div className="text-xs font-bold opacity-50">
                                        #{index + 1}
                                      </div>
                                      {step.icon}
                                      <div className="flex-1">
                                        <h4 className="font-medium">{step.name}</h4>
                                        <p className="text-xs opacity-75">{step.description}</p>
                                      </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-1">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (step.type === "coupon") {
                                            alert("Coming soon");
                                          } else {
                                            openEditModal(step);
                                          }
                                        }}
                                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-gray-200 rounded"
                                      >
                                        <Pencil className="h-4 w-4 text-gray-600" />
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          removeStep(step.uniqueId);
                                        }}
                                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-red-200 rounded"
                                      >
                                        <Trash2 className="h-4 w-4 text-red-600" />
                                      </button>
                                    </div>
                                  </div>
                                  
                                  {step.config && (
                                    <div className="mt-3 pt-3 border-t border-current opacity-50">
                                      <p className="text-xs font-medium mb-1">Configuration:</p>
                                      <div className="text-xs space-y-0.5">
                                        {step.type === 'markup' ? (
                                          <>
                                            <div>Type: Fixed Amount</div>
                                            <div>Default: ${step.config.markupValue || 0}</div>
                                            {step.config.groupDurationConfigs && Object.keys(step.config.groupDurationConfigs).length > 0 && (
                                              <div>Custom configs: {Object.keys(step.config.groupDurationConfigs).length} group(s)</div>
                                            )}
                                          </>
                                        ) : step.type === 'coupon' ? (
                                          <>
                                            <div>Coupons: {step.config.enableCoupons ? 'Enabled' : 'Disabled'}</div>
                                            <div>Corporate: {step.config.enableCorporateDiscounts ? 'Enabled' : 'Disabled'}</div>
                                            <div>Active: {step.config.activeCoupons || 0} coupons, {step.config.corporateDomains || 0} domains</div>
                                          </>
                                        ) : (
                                          <>
                                            {Object.entries(step.config).slice(0, 2).map(([key, value]) => (
                                              <div key={key}>
                                                {key}: {value}
                                              </div>
                                            ))}
                                            {Object.keys(step.config).length > 2 && (
                                              <div className="text-gray-500">...</div>
                                            )}
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </Card>
                              </div>
                            )}
                          </Draggable>
                        </React.Fragment>
                      ))}
                    </div>
                  )}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>

            {strategySteps.length > 0 && (
              <div className="mt-6 flex gap-3">
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Save Strategy
                </button>
                <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors">
                  Test Strategy
                </button>
                <button 
                  onClick={() => setStrategySteps([])}
                  className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  Clear All
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Rule Editing Modal */}
      <Dialog open={!!editingStep} onOpenChange={(open) => !open && setEditingStep(null)}>
        <DialogContent className={editingStep?.type === 'markup' || editingStep?.type === 'coupon' ? "max-w-7xl max-h-[90vh] overflow-y-auto" : "max-w-md"}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editingStep?.icon}
              Edit {editingStep?.name} Configuration
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {editingStep?.type === 'discount' && (
              <>
                <div className="space-y-2">
                  <Label>Discount Type</Label>
                  <Select
                    value={tempConfig.type}
                    onValueChange={(value) => setTempConfig({ ...tempConfig, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage</SelectItem>
                      <SelectItem value="fixed">Fixed Amount</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>
                    {tempConfig.type === 'percentage' ? 'Percentage (%)' : 'Amount ($)'}
                  </Label>
                  <Input
                    type="number"
                    value={tempConfig.value}
                    onChange={(e) => setTempConfig({ ...tempConfig, value: parseFloat(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Apply When</Label>
                  <Select
                    value={tempConfig.condition}
                    onValueChange={(value) => setTempConfig({ ...tempConfig, condition: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="always">Always</SelectItem>
                      <SelectItem value="min-days">Minimum Days</SelectItem>
                      <SelectItem value="bulk">Bulk Purchase</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {tempConfig.condition === 'min-days' && (
                  <div className="space-y-2">
                    <Label>Minimum Days</Label>
                    <Input
                      type="number"
                      value={tempConfig.minDays}
                      onChange={(e) => setTempConfig({ ...tempConfig, minDays: parseInt(e.target.value) })}
                    />
                  </div>
                )}
              </>
            )}

{editingStep?.type === 'markup' && <MarkupConfigurationModal tempConfig={tempConfig} setTempConfig={setTempConfig} />}

            {editingStep?.type === 'coupon' && <CouponConfigurationModal tempConfig={tempConfig} setTempConfig={setTempConfig} />}

            {editingStep?.type === 'fixed-price' && (
              <>
                <div className="space-y-2">
                  <Label>Base Price</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={tempConfig.basePrice}
                    onChange={(e) => setTempConfig({ ...tempConfig, basePrice: parseFloat(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Select
                    value={tempConfig.currency}
                    onValueChange={(value) => setTempConfig({ ...tempConfig, currency: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {editingStep?.type === 'processing-fee' && (
              <>
                <div className="space-y-2">
                  <Label>Payment Method</Label>
                  <Select
                    value={tempConfig.paymentMethod}
                    onValueChange={(value) => setTempConfig({ ...tempConfig, paymentMethod: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="card">Credit Card</SelectItem>
                      <SelectItem value="paypal">PayPal</SelectItem>
                      <SelectItem value="apple-pay">Apple Pay</SelectItem>
                      <SelectItem value="google-pay">Google Pay</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Fee Percentage (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={tempConfig.feePercentage}
                    onChange={(e) => setTempConfig({ ...tempConfig, feePercentage: parseFloat(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Fixed Fee ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={tempConfig.fixedFee}
                    onChange={(e) => setTempConfig({ ...tempConfig, fixedFee: parseFloat(e.target.value) })}
                  />
                </div>
              </>
            )}

            {editingStep?.type === 'keep-profit' && (
              <>
                <div className="space-y-2">
                  <Label>Profit Type</Label>
                  <Select
                    value={tempConfig.type}
                    onValueChange={(value) => setTempConfig({ ...tempConfig, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage</SelectItem>
                      <SelectItem value="fixed">Fixed Amount</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>
                    Minimum Profit {tempConfig.type === 'percentage' ? '(%)' : '($)'}
                  </Label>
                  <Input
                    type="number"
                    value={tempConfig.minProfit}
                    onChange={(e) => setTempConfig({ ...tempConfig, minProfit: parseFloat(e.target.value) })}
                  />
                </div>
              </>
            )}

            {editingStep?.type === 'psychological-rounding' && (
              <>
                <div className="space-y-2">
                  <Label>Pricing Strategy</Label>
                  <Select
                    value={tempConfig.strategy}
                    onValueChange={(value) => setTempConfig({ ...tempConfig, strategy: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="charm">Charm Pricing (.99)</SelectItem>
                      <SelectItem value="prestige">Prestige Pricing (.00)</SelectItem>
                      <SelectItem value="odd">Odd Pricing (.95)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Round To</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={tempConfig.roundTo}
                    onChange={(e) => setTempConfig({ ...tempConfig, roundTo: parseFloat(e.target.value) })}
                  />
                </div>
              </>
            )}

            {editingStep?.type === 'region-rounding' && (
              <>
                <div className="space-y-2">
                  <Label>Region</Label>
                  <Select
                    value={tempConfig.region}
                    onValueChange={(value) => setTempConfig({ ...tempConfig, region: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="us">United States</SelectItem>
                      <SelectItem value="eu">Europe</SelectItem>
                      <SelectItem value="uk">United Kingdom</SelectItem>
                      <SelectItem value="asia">Asia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Rounding Rule</Label>
                  <Select
                    value={tempConfig.roundingRule}
                    onValueChange={(value) => setTempConfig({ ...tempConfig, roundingRule: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nearest-dollar">Nearest Dollar</SelectItem>
                      <SelectItem value="nearest-five">Nearest $5</SelectItem>
                      <SelectItem value="nearest-ten">Nearest $10</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingStep(null)}>
              Cancel
            </Button>
            <Button onClick={saveStepConfig}>
              Save Configuration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DragDropContext>
  );
};

export default StrategyPage;