import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@workspace/ui";
import { MapPin, Plane } from "lucide-react";
import React from "react";
import { Trip } from "../../__generated__/graphql";

interface TripCardProps {
  trip: Trip;
  isSelected: boolean;
  onSelect: () => void;
}

export const TripCard: React.FC<TripCardProps> = ({
  trip,
  isSelected,
  onSelect,
}) => {
  return (
    <Card
      className={`group hover:shadow-md transition-all cursor-pointer ${
        isSelected
          ? "lg:ring-2 lg:ring-blue-500 lg:border-blue-500 lg:bg-blue-50"
          : "hover:border-gray-300"
      }`}
      onClick={onSelect}
    >
      <CardHeader className="p-4">
        <CardTitle className="text-base flex items-center justify-between">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="flex items-center gap-2 cursor-default">
                  <Plane className="h-4 w-4" />
                  {trip.name}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>Trip: {trip.name}</p>
                <p>Region: {trip.region}</p>
                {trip.description && <p>Description: {trip.description}</p>}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>

        <CardDescription className="text-sm">
          <div className="flex items-center gap-1 mb-1">
            <MapPin className="h-3 w-3" />
            <span>{trip.countries.length} countries</span>
          </div>
          <div className="text-xs text-gray-500">
            {trip.countries
              .slice(0, 3)
              .map((country) => country.name)
              .join(", ")}
            {trip.countries.length > 3 &&
              ` + ${trip.countries.length - 3} more`}
          </div>
        </CardDescription>
      </CardHeader>
    </Card>
  );
};
