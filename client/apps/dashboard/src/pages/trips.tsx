import { useState, useMemo } from 'react'
import { useQuery } from '@apollo/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/ui/components/card'
import { Badge } from '@workspace/ui/components/badge'
import { Button } from '@workspace/ui/components/button'
import { Input } from '@workspace/ui/components/input'
import { Skeleton } from '@workspace/ui/components/skeleton'
import { MapPin, Edit2, Plus, Search, AlertCircle } from 'lucide-react'
import { GET_TRIPS } from '@/lib/graphql/queries'

interface Trip {
  name: string
  description: string
  regionId: string
  countryIds: string[]
}

// Map for region names to Hebrew names (from the description field)
const extractHebrewName = (description: string): string => {
  // The description format is "Hebrew Name - Region Description"
  const parts = description.split(' - ')
  return parts[0] || description
}

// Map for getting emojis based on region names
const regionEmojis: Record<string, string> = {
  'south-america': '🌎',
  'africa': '🦁',
  'african-safari': '🦁',
  'europe': '🏰',
  'east-asia': '🏯',
  'asia': '🌏',
  'caribbean': '🏖️',
  'middle-east': '🕌',
  'north-america': '🗽',
  'oceania': '🌊',
  'balkans': '🏔️',
  'eu-plus': '🇪🇺',
  'global': '🌍'
}

export function TripsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const { data, loading, error } = useQuery<{ trips: Trip[] }>(GET_TRIPS)

  const filteredTrips = useMemo(() => {
    if (!data?.trips) return []
    
    return data.trips.filter(trip => {
      const hebrewName = extractHebrewName(trip.description)
      return (
        trip.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        hebrewName.includes(searchTerm) ||
        trip.regionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trip.countryIds.some(id => id.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    })
  }, [data?.trips, searchTerm])

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Trips</h1>
          <p className="text-muted-foreground">
            Manage regional eSIM bundles and trips
          </p>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center py-10">
            <div className="text-center space-y-2">
              <AlertCircle className="h-10 w-10 text-destructive mx-auto" />
              <p className="text-sm text-muted-foreground">
                Failed to load trips: {error.message}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Trips</h1>
        <p className="text-muted-foreground">
          Manage regional eSIM bundles and trips
        </p>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search regions or country codes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Region
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-4 w-32 mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredTrips.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center py-10">
            <p className="text-sm text-muted-foreground">
              {searchTerm ? 'No trips found matching your search' : 'No trips available'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredTrips.map((trip) => {
            const hebrewName = extractHebrewName(trip.description)
            const emoji = regionEmojis[trip.regionId.toLowerCase()] || '🌍'
            
            return (
              <Card key={trip.regionId}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2">
                        <span className="text-2xl">{emoji}</span>
                        <MapPin className="h-4 w-4" />
                        {trip.name}
                      </CardTitle>
                      <CardDescription>{hebrewName}</CardDescription>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium mb-2">Countries ({trip.countryIds.length})</p>
                    <div className="flex flex-wrap gap-1">
                      {trip.countryIds.map((countryId) => (
                        <Badge key={countryId} variant="secondary">
                          {countryId}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    <p>{trip.description}</p>
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline">Region ID: {trip.regionId}</Badge>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}