import { useState, useMemo } from 'react'
import { useQuery, useMutation } from '@apollo/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/ui/components/card'
import { Badge } from '@workspace/ui/components/badge'
import { Button } from '@workspace/ui/components/button'
import { Input } from '@workspace/ui/components/input'
import { Skeleton } from '@workspace/ui/components/skeleton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@workspace/ui/components/dropdown-menu'
import { MapPin, Edit2, Plus, Search, AlertCircle, MoreHorizontal, Trash2 } from 'lucide-react'
import { GET_TRIPS, DELETE_TRIP } from '@/lib/graphql/queries'
import { TripFormModal } from '@/components/trip-form-modal'
import { toast } from 'sonner'

interface Country {
  iso: string
  name: string
  nameHebrew: string
  region: string
  flag: string
}

interface Trip {
  id: string
  name: string
  description: string
  regionId: string
  countryIds: string[]
  countries: Country[]
  createdAt: string
  updatedAt: string
  createdBy?: string
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
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null)
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const { data, loading, error, refetch } = useQuery<{ trips: Trip[] }>(GET_TRIPS)
  const [deleteTrip] = useMutation(DELETE_TRIP)

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

  const handleCreateTrip = () => {
    setSelectedTrip(null)
    setIsFormModalOpen(true)
  }

  const handleEditTrip = (trip: Trip) => {
    setSelectedTrip(trip)
    setIsFormModalOpen(true)
  }

  const handleDeleteTrip = async (trip: Trip) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete the trip "${trip.name}"? This action cannot be undone.`
    )
    
    if (!confirmed) return

    try {
      const result = await deleteTrip({
        variables: { id: trip.id },
      })

      if (result.data?.deleteTrip?.success) {
        toast.success('Trip deleted successfully')
        refetch()
      } else {
        toast.error(result.data?.deleteTrip?.error || 'Failed to delete trip')
      }
    } catch (error) {
      console.error('Error deleting trip:', error)
      toast.error('An error occurred while deleting the trip')
    }
  }

  const handleFormSuccess = () => {
    refetch()
  }

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
        <Button onClick={handleCreateTrip}>
          <Plus className="mr-2 h-4 w-4" />
          Add Trip
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
              <Card key={trip.id}>
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
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditTrip(trip)}>
                          <Edit2 className="mr-2 h-4 w-4" />
                          Edit Trip
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => handleDeleteTrip(trip)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Trip
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
      
      <TripFormModal
        open={isFormModalOpen}
        onOpenChange={setIsFormModalOpen}
        trip={selectedTrip}
        onSuccess={handleFormSuccess}
      />
    </div>
  )
}