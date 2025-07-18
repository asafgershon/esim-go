import React, { useState, useEffect } from "react";
import { useMutation, useQuery } from "@apollo/client";
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
import { X, Plus, MapPin, Globe } from "lucide-react";
import { toast } from "sonner";
import { CREATE_TRIP, UPDATE_TRIP, GET_COUNTRIES } from "@/lib/graphql/queries";

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
  description: string;
  regionId: string;
  countryIds: string[];
  countries: Country[];
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

interface TripFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trip?: Trip | null;
  onSuccess?: () => void;
}

export function TripFormModal({ open, onOpenChange, trip, onSuccess }: TripFormModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    regionId: "",
    countryIds: [] as string[],
  });
  const [countrySearch, setCountrySearch] = useState("");
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: countriesData } = useQuery(GET_COUNTRIES);
  const [createTrip] = useMutation(CREATE_TRIP);
  const [updateTrip] = useMutation(UPDATE_TRIP);

  const countries = countriesData?.countries || [];
  const filteredCountries = countries.filter((country: Country) => {
    const searchLower = countrySearch.toLowerCase();
    return (
      country.name.toLowerCase().includes(searchLower) ||
      country.nameHebrew.includes(countrySearch) ||
      country.iso.toLowerCase().includes(searchLower)
    );
  });

  // Reset form when modal opens/closes or trip changes
  useEffect(() => {
    if (open) {
      if (trip) {
        setFormData({
          name: trip.name,
          description: trip.description,
          regionId: trip.regionId,
          countryIds: trip.countryIds,
        });
      } else {
        setFormData({
          name: "",
          description: "",
          regionId: "",
          countryIds: [],
        });
      }
    }
    setCountrySearch("");
    setIsSubmitting(false);
  }, [open, trip]);

  const handleAddCountry = (countryId: string) => {
    if (!formData.countryIds.includes(countryId)) {
      setFormData(prev => ({
        ...prev,
        countryIds: [...prev.countryIds, countryId],
      }));
    }
    setCountrySearch("");
    setShowCountryDropdown(false);
  };

  const handleRemoveCountry = (countryId: string) => {
    setFormData(prev => ({
      ...prev,
      countryIds: prev.countryIds.filter(id => id !== countryId),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error("Trip name is required");
      return;
    }
    
    if (!formData.description.trim()) {
      toast.error("Trip description is required");
      return;
    }
    
    if (!formData.regionId.trim()) {
      toast.error("Region ID is required");
      return;
    }
    
    if (formData.countryIds.length === 0) {
      toast.error("At least one country must be selected");
      return;
    }

    setIsSubmitting(true);
    
    try {
      if (trip) {
        // Update existing trip
        const result = await updateTrip({
          variables: {
            input: {
              id: trip.id,
              name: formData.name.trim(),
              description: formData.description.trim(),
              regionId: formData.regionId.trim(),
              countryIds: formData.countryIds,
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
              name: formData.name.trim(),
              description: formData.description.trim(),
              regionId: formData.regionId.trim(),
              countryIds: formData.countryIds,
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
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedCountries = formData.countryIds.map(id => 
    countries.find((country: Country) => country.iso === id)
  ).filter(Boolean) as Country[];

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

        <form onSubmit={handleSubmit} className="space-y-6 overflow-y-auto max-h-[calc(90vh-120px)] px-1">
          {/* Basic Information */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Trip Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., European Adventure"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter trip description..."
                rows={3}
                required
              />
            </div>

            <div>
              <Label htmlFor="regionId">Region ID *</Label>
              <Input
                id="regionId"
                value={formData.regionId}
                onChange={(e) => setFormData(prev => ({ ...prev, regionId: e.target.value }))}
                placeholder="e.g., europe, asia, north-america"
                required
              />
            </div>
          </div>

          <Separator />

          {/* Country Selection */}
          <div className="space-y-4">
            <div>
              <Label className="text-base font-semibold flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Countries ({formData.countryIds.length})
              </Label>
              <p className="text-sm text-muted-foreground">
                Select countries to include in this trip
              </p>
            </div>

            {/* Selected Countries */}
            {selectedCountries.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Selected Countries</Label>
                <div className="flex flex-wrap gap-2 p-3 bg-muted/30 rounded-lg">
                  {selectedCountries.map((country) => (
                    <Badge
                      key={country.iso}
                      variant="secondary"
                      className="flex items-center gap-2"
                    >
                      <span>{country.flag}</span>
                      <span>{country.name}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveCountry(country.iso)}
                        className="ml-1 hover:bg-destructive hover:text-destructive-foreground rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Country Search */}
            <div className="relative">
              <Label htmlFor="countrySearch">Add Countries</Label>
              <div className="relative">
                <Input
                  id="countrySearch"
                  value={countrySearch}
                  onChange={(e) => {
                    setCountrySearch(e.target.value);
                    setShowCountryDropdown(e.target.value.length > 0);
                  }}
                  onFocus={() => setShowCountryDropdown(countrySearch.length > 0)}
                  onBlur={() => {
                    // Delay to allow click on dropdown items
                    setTimeout(() => setShowCountryDropdown(false), 200);
                  }}
                  placeholder="Search by country name or code..."
                  autoComplete="off"
                />
              </div>
            </div>

            {/* Country Dropdown */}
            {showCountryDropdown && filteredCountries.length > 0 && (
              <div className="absolute z-50 w-full max-h-60 overflow-y-auto bg-background border rounded-lg shadow-lg">
                {filteredCountries.slice(0, 20).map((country: Country) => (
                  <button
                    key={country.iso}
                    type="button"
                    onClick={() => handleAddCountry(country.iso)}
                    disabled={formData.countryIds.includes(country.iso)}
                    className={`w-full flex items-center gap-3 p-3 text-left hover:bg-muted transition-colors border-b last:border-b-0 ${
                      formData.countryIds.includes(country.iso) 
                        ? "bg-muted opacity-60 cursor-not-allowed" 
                        : "cursor-pointer"
                    }`}
                  >
                    <span className="text-lg">{country.flag}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{country.name}</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        <span className="font-mono">{country.iso}</span>
                        <span>•</span>
                        <span className="truncate">{country.nameHebrew}</span>
                      </div>
                    </div>
                    {formData.countryIds.includes(country.iso) ? (
                      <Badge variant="outline" className="text-xs">
                        Selected
                      </Badge>
                    ) : (
                      <Plus className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

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
              disabled={isSubmitting || formData.countryIds.length === 0}
            >
              {isSubmitting ? "Saving..." : trip ? "Update Trip" : "Create Trip"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}