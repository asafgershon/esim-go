import {
  CREATE_CORPORATE_EMAIL_DOMAIN,
  CREATE_COUPON,
  DELETE_CORPORATE_EMAIL_DOMAIN,
  DELETE_COUPON,
  GET_CORPORATE_EMAIL_DOMAINS,
  GET_COUPONS,
  TOGGLE_CORPORATE_EMAIL_DOMAIN,
  TOGGLE_COUPON,
  UPDATE_CORPORATE_EMAIL_DOMAIN,
  UPDATE_COUPON,
} from "@/lib/graphql/queries";
import { useMutation, useQuery } from "@apollo/client";
import { Button, Card, Label } from "@workspace/ui";
import {
  Building,
  Eye,
  EyeOff,
  Loader,
  Pencil,
  Plus,
  Tag,
  Trash2,
} from "lucide-react";
import React, { useState } from "react";
import { CouponConfigurationModalProps } from "../../types";

const CouponConfigurationModal: React.FC<CouponConfigurationModalProps> = ({
  tempConfig,
  setTempConfig,
}) => {
  const [activeTab, setActiveTab] = useState<"coupons" | "corporate">(
    "coupons"
  );
  const [editingCoupon, setEditingCoupon] = useState<any>(null);
  const [editingDomain, setEditingDomain] = useState<any>(null);
  const [showCreateCoupon, setShowCreateCoupon] = useState(false);
  const [showCreateDomain, setShowCreateDomain] = useState(false);

  // GraphQL hooks
  const {
    data: couponsData,
    loading: couponsLoading,
    refetch: refetchCoupons,
  } = useQuery(GET_COUPONS, {
    variables: { filter: { isActive: true } },
  });
  const {
    data: domainsData,
    loading: domainsLoading,
    refetch: refetchDomains,
  } = useQuery(GET_CORPORATE_EMAIL_DOMAINS);

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
    if (!dateString) return "No limit";
    return new Date(dateString).toLocaleDateString();
  };

  const getUsageText = (coupon: any) => {
    const used = coupon.usageStats?.totalUsages || 0;
    const total = coupon.maxTotalUsage || "unlimited";
    return `${used}/${total}`;
  };

  const handleCreateCoupon = async (couponData: any) => {
    try {
      await createCoupon({ variables: { input: couponData } });
      refetchCoupons();
      setShowCreateCoupon(false);
    } catch (error) {
      console.error("Error creating coupon:", error);
    }
  };

  const handleUpdateCoupon = async (id: string, couponData: any) => {
    try {
      await updateCoupon({ variables: { id, input: couponData } });
      refetchCoupons();
      setEditingCoupon(null);
    } catch (error) {
      console.error("Error updating coupon:", error);
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    if (confirm("Are you sure you want to delete this coupon?")) {
      try {
        await deleteCoupon({ variables: { id } });
        refetchCoupons();
      } catch (error) {
        console.error("Error deleting coupon:", error);
      }
    }
  };

  const handleToggleCoupon = async (id: string) => {
    try {
      await toggleCoupon({ variables: { id } });
      refetchCoupons();
    } catch (error) {
      console.error("Error toggling coupon:", error);
    }
  };

  const handleCreateDomain = async (domainData: any) => {
    try {
      await createDomain({ variables: { input: domainData } });
      refetchDomains();
      setShowCreateDomain(false);
    } catch (error) {
      console.error("Error creating domain:", error);
    }
  };

  const handleUpdateDomain = async (id: string, domainData: any) => {
    try {
      await updateDomain({ variables: { id, input: domainData } });
      refetchDomains();
      setEditingDomain(null);
    } catch (error) {
      console.error("Error updating domain:", error);
    }
  };

  const handleDeleteDomain = async (id: string) => {
    if (confirm("Are you sure you want to delete this corporate domain?")) {
      try {
        await deleteDomain({ variables: { id } });
        refetchDomains();
      } catch (error) {
        console.error("Error deleting domain:", error);
      }
    }
  };

  const handleToggleDomain = async (id: string) => {
    try {
      await toggleDomain({ variables: { id } });
      refetchDomains();
    } catch (error) {
      console.error("Error toggling domain:", error);
    }
  };

  return (
    <>
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("coupons")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "coupons"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <Tag className="w-4 h-4 inline mr-2" />
            Discount Coupons
          </button>
          <button
            onClick={() => setActiveTab("corporate")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "corporate"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <Building className="w-4 h-4 inline mr-2" />
            Corporate Domains
          </button>
        </nav>
      </div>

      {/* Coupons Tab */}
      {activeTab === "coupons" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="font-medium text-gray-900">
              Manage Discount Coupons
            </h4>
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
                  <p className="text-sm">
                    No coupons found. Create your first coupon to get started.
                  </p>
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
                            {coupon.couponType === "percentage"
                              ? `${coupon.value}% off`
                              : `$${coupon.value} off`}
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Valid: {formatDate(coupon.validFrom)} -{" "}
                          {formatDate(coupon.validUntil)}
                        </div>
                        <div className="text-xs text-gray-500 flex items-center gap-4 mt-1">
                          <span>Usage: {getUsageText(coupon)}</span>
                          {coupon.minSpend && (
                            <span>Min spend: ${coupon.minSpend}</span>
                          )}
                          {coupon.maxDiscount && (
                            <span>Max discount: ${coupon.maxDiscount}</span>
                          )}
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
                          {coupon.isActive ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
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
      {activeTab === "corporate" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="font-medium text-gray-900">
              Corporate Email Domains
            </h4>
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
                  <p className="text-sm">
                    No corporate domains configured. Add domains to provide
                    automatic discounts.
                  </p>
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
                          {domain.minSpend && (
                            <span>Min spend: ${domain.minSpend}</span>
                          )}
                          {domain.maxDiscount && (
                            <span>Max discount: ${domain.maxDiscount}</span>
                          )}
                          <span>
                            Usage: {domain.usageStats?.totalUsages || 0} users
                          </span>
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
                          {domain.isActive ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
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
        <Label className="text-sm font-medium text-gray-700">
          Coupon System Status
        </Label>
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-xs space-y-1 text-blue-800">
            <p>
              <strong>Active Coupons:</strong>{" "}
              {coupons.filter((c: any) => c.isActive).length}
            </p>
            <p>
              <strong>Corporate Domains:</strong>{" "}
              {domains.filter((d: any) => d.isActive).length}
            </p>
            <p>
              <strong>Total Usage:</strong>{" "}
              {coupons.reduce(
                (acc: number, c: any) => acc + (c.usageStats?.totalUsages || 0),
                0
              )}{" "}
              redemptions
            </p>
          </div>
        </div>
      </div>

      {/* Create/Edit Coupon Modal would go here */}
      {/* Create/Edit Domain Modal would go here */}
    </>
  );
};

export default CouponConfigurationModal;