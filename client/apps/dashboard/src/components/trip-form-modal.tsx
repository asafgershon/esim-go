import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Textarea } from "@workspace/ui/components/textarea";
import { Badge } from "@workspace/ui/components/badge";
import { Separator } from "@workspace/ui/components/separator";
import { MultiCountrySelect } from "@workspace/ui/components/multi-country-select";
import { X, Plus, MapPin, Globe, Search, Check } from "lucide-react";
import { toast } from "sonner";
import { CREATE_TRIP, UPDATE_TRIP, GET_COUNTRIES, GET_CATALOG_BUNDLES } from "@/lib/graphql/queries";

interface Country {
  iso: string;
  name: string;
  nameHebrew: string;
  region: string;
  flag: string;
}

interface Trip {
  id: string;
  name: string;
  title: string;
  description: string;
  bundleName: string;
  regionId: string;
  countryIds: string[];
  countries: Country[];
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

interface Bundle {
  esimGoName: string;
  description?: string;
  region?: string;
  validityInDays?: number | null;
  basePrice: number;
  currency: string;
  isUnlimited: boolean;
  countries?: string[];
}

// Zod validation schema
const tripFormSchema = z.object({
  name: z.string().min(1, "Trip name is required").max(100, "Trip name must be less than 100 characters"),
  title: z.string().min(1, "Title is required").max(100, "Title must be less than 100 characters"),
  description: z.string().min(1, "Description is required").max(500, "Description must be less than 500 characters"),
  bundleName: z.string().min(1, "Bundle selection is required"),
});

type TripFormData = z.infer<typeof tripFormSchema>;

interface TripFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trip?: Trip | null;
  onSuccess?: () => void;
}

export function TripFormModal({ open, onOpenChange, trip, onSuccess }: TripFormModalProps) {
  const [bundleSearch, setBundleSearch] = useState("");
  const [selectedBundle, setSelectedBundle] = useState<Bundle | null>(null);

  const { data: bundlesData, loading: bundlesLoading, error: bundlesError } = useQuery(GET_CATALOG_BUNDLES, {
    variables: { criteria: { limit: 100 } },
    onCompleted: (data) => {
      console.log('Bundles data loaded:', data);
    },
    onError: (error) => {
      console.error('Error loading bundles:', error);
    }
  });
  const [createTrip] = useMutation(CREATE_TRIP);
  const [updateTrip] = useMutation(UPDATE_TRIP);

  const form = useForm<TripFormData>({
    resolver: zodResolver(tripFormSchema),
    defaultValues: {
      name: "",
      title: "",
      description: "",
      bundleName: "",
    },
  });

  const { control, handleSubmit, formState: { errors, isSubmitting }, reset, setValue, watch } = form;
  const watchedBundleName = watch("bundleName");

  const bundles = useMemo(() => 
    bundlesData?.catalogBundles?.bundles || [], 
    [bundlesData?.catalogBundles?.bundles]
  );
  
  const filteredBundles = useMemo(() => 
    bundles.filter((bundle: Bundle) => {
      const searchLower = bundleSearch.toLowerCase();
      return (
        bundle.esimGoName.toLowerCase().includes(searchLower) ||
        (bundle.description && bundle.description.toLowerCase().includes(searchLower)) ||
        (bundle.region && bundle.region.toLowerCase().includes(searchLower))
      );
    }),
    [bundles, bundleSearch]
  );

  // Reset form when modal opens/closes or trip changes
  useEffect(() => {
    if (open) {
      if (trip) {
        reset({
          name: trip.name,
          title: trip.title,
          description: trip.description,
          bundleName: trip.bundleName,
        });
      } else {
        reset({
          name: "",
          title: "",
          description: "",
          bundleName: "",
        });
        setSelectedBundle(null);
      }
    }
    setBundleSearch("");
  }, [open, trip]);

  // Separate effect to handle bundle selection when bundles are loaded
  useEffect(() => {
    if (trip && trip.bundleName && bundles.length > 0) {
      const bundle = bundles.find(b => b.esimGoName === trip.bundleName);
      if (bundle) {
        setSelectedBundle(bundle);
      }
    }
  }, [trip, bundles]);

  const onSubmit = async (data: TripFormData) => {
    try {
      if (trip) {
        // Update existing trip
        const result = await updateTrip({
          variables: {
            input: {
              id: trip.id,
              name: data.name.trim(),
              title: data.title.trim(),
              description: data.description.trim(),
              bundleName: data.bundleName,
            },
          },
        });

        if (result.data?.updateTrip?.success) {
          toast.success("Trip updated successfully");
          onSuccess?.();
          onOpenChange(false);
        } else {
          toast.error(result.data?.updateTrip?.error || "Failed to update trip");
        }
      } else {
        // Create new trip
        const result = await createTrip({
          variables: {
            input: {
              name: data.name.trim(),
              title: data.title.trim(),
              description: data.description.trim(),
              bundleName: data.bundleName,
            },
          },
        });

        if (result.data?.createTrip?.success) {
          toast.success("Trip created successfully");
          onSuccess?.();
          onOpenChange(false);
        } else {
          toast.error(result.data?.createTrip?.error || "Failed to create trip");
        }
      }
    } catch (error) {
      console.error("Error submitting trip:", error);
      toast.error("An error occurred while saving the trip");
    }
  };


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            {trip ? "Edit Trip" : "Create New Trip"}
          </DialogTitle>
          <DialogDescription>
            {trip ? "Update the trip information" : "Create a new trip with selected countries"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 overflow-y-auto max-h-[calc(90vh-120px)] px-1 pb-4">
          {/* Basic Information */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Trip Name *</Label>
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <Input
                    id="name"
                    placeholder="e.g., European Adventure"
                    {...field}
                  />
                )}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <Textarea
                    id="description"
                    placeholder="Enter trip description..."
                    rows={3}
                    {...field}
                  />
                )}
              />
              {errors.description && (
                <p className="text-sm text-destructive">{errors.description.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Trip Title *</Label>
              <Controller
                name="title"
                control={control}
                render={({ field }) => (
                  <Input
                    id="title"
                    placeholder="e.g., Ultimate Europe eSIM Package"
                    {...field}
                  />
                )}
              />
              {errors.title && (
                <p className="text-sm text-destructive">{errors.title.message}</p>
              )}
            </div>
          </div>

          <Separator />

          {/* Bundle Selection */}
          <div className="space-y-4">
            <div>
              <Label className="text-base font-semibold flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Bundle Selection *
              </Label>
              <p className="text-sm text-muted-foreground">
                Select a bundle from the catalog to associate with this trip
              </p>
            </div>

            {/* Bundle Selection Area */}
            <Controller
              name="bundleName"
              control={control}
              render={({ field }) => (
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Search bundles by name, region, or description..."
                      value={bundleSearch}
                      onChange={(e) => setBundleSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  <div className="max-h-60 overflow-y-auto border rounded-md">
                    {bundlesLoading ? (
                      <div className="p-4 text-center text-muted-foreground">
                        Loading bundles...
                      </div>
                    ) : bundlesError ? (
                      <div className="p-4 text-center text-destructive">
                        Error loading bundles: {bundlesError.message}
                      </div>
                    ) : bundles.length === 0 ? (
                      <div className="p-4 text-center text-muted-foreground">
                        No bundles available in catalog. Please sync catalog data first.
                      </div>
                    ) : filteredBundles.length === 0 ? (
                      <div className="p-4 text-center text-muted-foreground">
                        No bundles found. Try adjusting your search.
                      </div>
                    ) : (
                      <div className="divide-y">
                        {filteredBundles.slice(0, 20).map((bundle) => (
                          <div
                            key={bundle.esimGoName}
                            className={`p-3 cursor-pointer hover:bg-muted/50 transition-colors ${
                              field.value === bundle.esimGoName ? 'bg-primary/10 border-l-4 border-l-primary' : ''
                            }`}
                            onClick={() => {
                              field.onChange(bundle.esimGoName);
                              setSelectedBundle(bundle);
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="font-medium">{bundle.esimGoName}</div>
                                {bundle.description && (
                                  <div className="text-sm text-muted-foreground mt-1">
                                    {bundle.description}
                                  </div>
                                )}
                                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                  {bundle.region && <span>Region: {bundle.region}</span>}
                                  {bundle.validityInDays && <span>{bundle.validityInDays} days</span>}
                                  <span className="font-medium text-foreground">
                                    {bundle.basePrice} {bundle.currency}
                                  </span>
                                </div>
                              </div>
                              {field.value === bundle.esimGoName && (
                                <Check className="h-5 w-5 text-primary" />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            />
            {errors.bundleName && (
              <p className="text-sm text-destructive">{errors.bundleName.message}</p>
            )}
          </div>

          {/* Bundle Preview */}
          {selectedBundle && (
            <div className="bg-muted/30 rounded-lg p-4 space-y-2">
              <h4 className="font-medium">Selected Bundle Details</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Bundle ID:</span>
                  <span className="ml-2 font-mono">{selectedBundle.esimGoName}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Region:</span>
                  <span className="ml-2">{selectedBundle.region || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Price:</span>
                  <span className="ml-2">{selectedBundle.basePrice} {selectedBundle.currency}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Type:</span>
                  <span className="ml-2">{selectedBundle.isUnlimited ? 'Unlimited' : 'Limited Data'}</span>
                </div>
              </div>
              {selectedBundle.countries && selectedBundle.countries.length > 0 && (
                <div>
                  <span className="text-muted-foreground text-sm">Countries:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedBundle.countries.slice(0, 8).map((country) => (
                      <Badge key={country} variant="secondary" className="text-xs">
                        {country}
                      </Badge>
                    ))}
                    {selectedBundle.countries.length > 8 && (
                      <Badge variant="secondary" className="text-xs">
                        +{selectedBundle.countries.length - 8} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Form Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isSubmitting || !watchedBundleName}
            >
              {isSubmitting ? "Saving..." : trip ? "Update Trip" : "Create Trip"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}