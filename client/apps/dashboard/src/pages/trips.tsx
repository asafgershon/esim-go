import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/ui/components/card'
import { Badge } from '@workspace/ui/components/badge'
import { Button } from '@workspace/ui/components/button'
import { Input } from '@workspace/ui/components/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@workspace/ui/components/table'
import { MapPin, Edit2, Plus, Search } from 'lucide-react'

// This would normally come from your regions-datasource
const PREDEFINED_REGIONS = [
  {
    name: "Africa",
    nameHebrew: "אפריקה",
    countryIds: ["EG", "MA", "TZ", "UG", "TN", "ZA", "ZM", "MG", "NG", "KE", "MU", "NA", "BW"],
    bundleIds: {
      unlimited: {
        "3D": "esim_UL_3D_RAF_V2",
        "5D": "esim_UL_5D_RAF_V2",
        "7D": "esim_UL_7D_RAF_V2",
        "10D": "esim_UL_10D_RAF_V2",
      }
    }
  },
  {
    name: "Americas",
    nameHebrew: "אמריקה",
    countryIds: ["AR", "BR", "CL", "CO", "CR", "EC", "SV", "PE", "UY", "GF", "MX"],
    bundleIds: {
      unlimited: {
        "3D": "esim_UL_3D_RLA_V2",
        "5D": "esim_UL_5D_RLA_V2",
        "7D": "esim_UL_7D_RLA_V2",
        "10D": "esim_UL_10D_RLA_V2",
        "15D": "esim_UL_15D_RLA_V2",
        "30D": "esim_UL_30D_RLA_V2",
      }
    }
  },
  {
    name: "Asia",
    nameHebrew: "אסיה",
    countryIds: ["AU", "HK", "ID", "KR", "MO", "MY", "PK", "SG", "LK", "TW", "TH", "UZ", "VN", "IN", "NP"],
    bundleIds: {
      unlimited: {
        "3D": "esim_UL_3D_RAS_V2",
        "5D": "esim_UL_5D_RAS_V2",
        "7D": "esim_UL_7D_RAS_V2",
        "10D": "esim_UL_10D_RAS_V2",
        "15D": "esim_UL_15D_RAS_V2",
        "30D": "esim_UL_30D_RAS_V2",
      }
    }
  },
  {
    name: "Balkans",
    nameHebrew: "הבלקן",
    countryIds: ["AL", "BA", "BG", "GR", "HR", "MK", "ME", "RO", "RS", "SI"],
    bundleIds: {
      unlimited: {
        "3D": "esim_UL_3D_RBK_V2",
        "5D": "esim_UL_5D_RBK_V2",
        "7D": "esim_UL_7D_RBK_V2",
        "10D": "esim_UL_10D_RBK_V2",
        "15D": "esim_UL_15D_RBK_V2",
      }
    }
  },
  {
    name: "EU+",
    nameHebrew: "אירופה מורחבת",
    countryIds: ["AT", "DK", "IE", "IT", "SE", "FR", "BG", "CY", "EE", "FI", "GR", "HU", "LV", "LT", "NL", "NO", "PL", "RO", "SK", "ES", "GB", "TR", "DE", "MT", "CH", "BE", "HR", "CZ", "LI", "LU", "PT", "SI", "IS", "IC", "VA"],
    bundleIds: {}
  },
  {
    name: "Caribbean",
    nameHebrew: "הקריביים",
    countryIds: ["AI", "AG", "BS", "BB", "KY", "GD", "JM", "MS", "AN", "KN", "LC", "VC", "TT", "TC", "VG", "AW", "BQ", "CW", "DM", "GP", "GY", "HT", "SV", "GF", "BM"],
    bundleIds: {
      unlimited: {
        "3D": "esim_UL_3D_RCA_V2",
        "5D": "esim_UL_5D_RCA_V2",
        "7D": "esim_UL_7D_RCA_V2",
        "10D": "esim_UL_10D_RCA_V2",
        "15D": "esim_UL_15D_RCA_V2",
      }
    }
  }
]

export function TripsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [regions] = useState(PREDEFINED_REGIONS)

  const filteredRegions = regions.filter(region =>
    region.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    region.nameHebrew.includes(searchTerm) ||
    region.countryIds.some(id => id.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const getBundleCount = (region: typeof PREDEFINED_REGIONS[0]) => {
    let count = 0
    if (region.bundleIds.unlimited) {
      count += Object.keys(region.bundleIds.unlimited).length
    }
    return count
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

      <div className="grid gap-4">
        {filteredRegions.map((region) => (
          <Card key={region.name}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {region.name}
                  </CardTitle>
                  <CardDescription>{region.nameHebrew}</CardDescription>
                </div>
                <Button variant="ghost" size="sm">
                  <Edit2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-2">Countries ({region.countryIds.length})</p>
                <div className="flex flex-wrap gap-1">
                  {region.countryIds.map((countryId) => (
                    <Badge key={countryId} variant="secondary">
                      {countryId}
                    </Badge>
                  ))}
                </div>
              </div>

              {getBundleCount(region) > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Available Bundles</p>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Bundle ID</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {region.bundleIds.unlimited && Object.entries(region.bundleIds.unlimited).map(([duration, bundleId]) => (
                        <TableRow key={bundleId}>
                          <TableCell>
                            <Badge>Unlimited</Badge>
                          </TableCell>
                          <TableCell>{duration}</TableCell>
                          <TableCell className="font-mono text-xs">{bundleId}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}