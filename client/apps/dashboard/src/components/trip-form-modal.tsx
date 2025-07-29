import React, { useState, useEffect } from "react";
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

// Zod validation schema
const tripFormSchema = z.object({
  name: z.string().min(1, "Trip name is required").max(100, "Trip name must be less than 100 characters"),
  description: z.string().min(1, "Description is required").max(500, "Description must be less than 500 characters"),
  regionId: z.string().min(1, "Region ID is required").max(50, "Region ID must be less than 50 characters"),
  countryIds: z.array(z.string()).min(1, "At least one country must be selected"),
});

type TripFormData = z.infer<typeof tripFormSchema>;

interface TripFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trip?: Trip | null;
  onSuccess?: () => void;
}

export function TripFormModal({ open, onOpenChange, trip, onSuccess }: TripFormModalProps) {
  const [countrySearch, setCountrySearch] = useState("");
  const [showCountryPopover, setShowCountryPopover] = useState(false);

  const { data: countriesData } = useQuery(GET_COUNTRIES);
  const [createTrip] = useMutation(CREATE_TRIP);
  const [updateTrip] = useMutation(UPDATE_TRIP);

  const form = useForm<TripFormData>({
    resolver: zodResolver(tripFormSchema),
    defaultValues: {
      name: "",
      description: "",
      regionId: "",
      countryIds: [],
    },
  });

  const { control, handleSubmit, formState: { errors, isSubmitting }, reset, setValue, watch } = form;
  const watchedCountryIds = watch("countryIds");

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
        reset({
          name: trip.name,
          description: trip.description,
          regionId: trip.regionId,
          countryIds: trip.countryIds,
        });
      } else {
        reset({
          name: "",
          description: "",
          regionId: "",
          countryIds: [],
        });
      }
    }
    setCountrySearch("");
  }, [open, trip, reset]);

  const onSubmit = async (data: TripFormData) => {
    try {
      if (trip) {
        // Update existing trip
        const result = await updateTrip({
          variables: {
            input: {
              id: trip.id,
              name: data.name.trim(),
              description: data.description.trim(),
              regionId: data.regionId.trim(),
              countryIds: data.countryIds,
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
              description: data.description.trim(),
              regionId: data.regionId.trim(),
              countryIds: data.countryIds,
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
              <Label htmlFor="regionId">Region ID *</Label>
              <Controller
                name="regionId"
                control={control}
                render={({ field }) => (
                  <Input
                    id="regionId"
                    placeholder="e.g., europe, asia, north-america"
                    {...field}
                  />
                )}
              />
              {errors.regionId && (
                <p className="text-sm text-destructive">{errors.regionId.message}</p>
              )}
            </div>
          </div>

          <Separator />

          {/* Country Selection */}
          <div className="space-y-4">
            <div>
              <Label className="text-base font-semibold flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Countries ({watchedCountryIds.length})
              </Label>
              <p className="text-sm text-muted-foreground">
                Select countries to include in this trip
              </p>
            </div>

            {/* Countries Selection Area */}
            <Controller
              name="countryIds"
              control={control}
              render={({ field }) => (
                <MultiCountrySelect
                  countries={countries?.map((c: Country) => ({
                    id: c.iso,
                    name: c.name,
                    iso: c.iso,
                    flag: c.flag || '',
                    keywords: [c.nameHebrew || '']
                  })) || []}
                  value={field.value}
                  onValueChange={field.onChange}
                  placeholder="Select countries..."
                  searchPlaceholder="Search by country name or code..."
                  emptyMessage="No countries found."
                  loading={loading}
                />
              )}
            />
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
              disabled={isSubmitting || watchedCountryIds.length === 0}
            >
              {isSubmitting ? "Saving..." : trip ? "Update Trip" : "Create Trip"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}