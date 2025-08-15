"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui";
import { Button } from "@workspace/ui";
import { Badge } from "@workspace/ui";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/ui";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui";
import { 
  CheckCircle, 
  Clock, 
  XCircle, 
  Send, 
  User,
  Smartphone,
  Calendar,
  Globe,
  DollarSign
} from "lucide-react";

// Mock data for Active eSIMs
const activeESIMs = [
  {
    id: "ESM-001",
    employeeName: "David Cohen",
    employeeEmail: "david.cohen@company.com",
    destination: "United States",
    dataPackage: "10GB / 30 days",
    activatedDate: "2024-01-15",
    expiryDate: "2024-02-14",
    status: "active",
    usagePercent: 65,
    cost: "$45"
  },
  {
    id: "ESM-002",
    employeeName: "Sarah Levi",
    employeeEmail: "sarah.levi@company.com",
    destination: "Japan",
    dataPackage: "5GB / 14 days",
    activatedDate: "2024-01-20",
    expiryDate: "2024-02-03",
    status: "active",
    usagePercent: 30,
    cost: "$35"
  },
  {
    id: "ESM-003",
    employeeName: "Michael Goldberg",
    employeeEmail: "michael.g@company.com",
    destination: "United Kingdom",
    dataPackage: "15GB / 30 days",
    activatedDate: "2024-01-10",
    expiryDate: "2024-02-09",
    status: "active",
    usagePercent: 85,
    cost: "$50"
  },
  {
    id: "ESM-004",
    employeeName: "Rachel Mizrahi",
    employeeEmail: "rachel.m@company.com",
    destination: "France",
    dataPackage: "8GB / 21 days",
    activatedDate: "2024-01-18",
    expiryDate: "2024-02-08",
    status: "active",
    usagePercent: 42,
    cost: "$40"
  },
];

// Mock data for eSIM Requests
const esimRequests = [
  {
    id: "REQ-101",
    employeeName: "Yossi Ben-David",
    employeeEmail: "yossi.bd@company.com",
    department: "Sales",
    destination: "Germany",
    travelDates: "Feb 5 - Feb 12, 2024",
    dataPackage: "10GB / 7 days",
    requestDate: "2024-01-25",
    status: "pending",
    cost: "$38",
    reason: "Client meetings in Berlin"
  },
  {
    id: "REQ-102",
    employeeName: "Maya Shapira",
    employeeEmail: "maya.s@company.com",
    department: "Marketing",
    destination: "Spain",
    travelDates: "Feb 10 - Feb 20, 2024",
    dataPackage: "15GB / 10 days",
    requestDate: "2024-01-26",
    status: "approved",
    cost: "$55",
    reason: "Marketing conference in Barcelona"
  },
  {
    id: "REQ-103",
    employeeName: "Amit Rosenberg",
    employeeEmail: "amit.r@company.com",
    department: "Engineering",
    destination: "Canada",
    travelDates: "Feb 15 - Feb 25, 2024",
    dataPackage: "20GB / 10 days",
    requestDate: "2024-01-24",
    status: "rejected",
    cost: "$65",
    reason: "Tech summit in Toronto"
  },
  {
    id: "REQ-104",
    employeeName: "Noa Friedman",
    employeeEmail: "noa.f@company.com",
    department: "HR",
    destination: "Italy",
    travelDates: "Feb 8 - Feb 15, 2024",
    dataPackage: "8GB / 7 days",
    requestDate: "2024-01-27",
    status: "pending",
    cost: "$35",
    reason: "Recruitment fair in Milan"
  },
  {
    id: "REQ-105",
    employeeName: "Daniel Katz",
    employeeEmail: "daniel.k@company.com",
    department: "Finance",
    destination: "Singapore",
    travelDates: "Mar 1 - Mar 10, 2024",
    dataPackage: "12GB / 10 days",
    requestDate: "2024-01-27",
    status: "pending",
    cost: "$48",
    reason: "Annual finance summit"
  },
];

export default function ESIMRequestsPage() {
  const [activeTab, setActiveTab] = useState("active");

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500 text-white">Active</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500 text-white">Pending</Badge>;
      case "approved":
        return <Badge className="bg-blue-500 text-white">Approved</Badge>;
      case "rejected":
        return <Badge className="bg-red-500 text-white">Rejected</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getUsageColor = (percent: number) => {
    if (percent < 50) return "bg-green-500";
    if (percent < 80) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">eSIM Management</h2>
        <div className="flex items-center space-x-2">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Send className="mr-2 h-4 w-4" />
            Issue New eSIM
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active eSIMs</CardTitle>
            <Smartphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeESIMs.length}</div>
            <p className="text-xs text-muted-foreground">Currently in use</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {esimRequests.filter(r => r.status === "pending").length}
            </div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">With travel plans</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$483</div>
            <p className="text-xs text-muted-foreground">This month's total</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabbed Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="active">Active eSIMs</TabsTrigger>
          <TabsTrigger value="requests">Requests</TabsTrigger>
        </TabsList>

        {/* Active eSIMs Tab */}
        <TabsContent value="active" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Currently Active eSIMs</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Employee</TableHead>
                    <TableHead>Destination</TableHead>
                    <TableHead>Package</TableHead>
                    <TableHead>Usage</TableHead>
                    <TableHead>Expiry</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeESIMs.map((esim) => (
                    <TableRow key={esim.id}>
                      <TableCell className="font-medium">{esim.id}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{esim.employeeName}</div>
                          <div className="text-sm text-muted-foreground">
                            {esim.employeeEmail}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Globe className="mr-2 h-4 w-4" />
                          {esim.destination}
                        </div>
                      </TableCell>
                      <TableCell>{esim.dataPackage}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-sm">{esim.usagePercent}%</div>
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${getUsageColor(esim.usagePercent)}`}
                              style={{ width: `${esim.usagePercent}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Calendar className="mr-2 h-4 w-4" />
                          {esim.expiryDate}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{esim.cost}</TableCell>
                      <TableCell>{getStatusBadge(esim.status)}</TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Requests Tab */}
        <TabsContent value="requests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>eSIM Requests from Employees</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Request ID</TableHead>
                    <TableHead>Employee</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Destination</TableHead>
                    <TableHead>Travel Dates</TableHead>
                    <TableHead>Package</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {esimRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium">{request.id}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{request.employeeName}</div>
                          <div className="text-sm text-muted-foreground">
                            {request.employeeEmail}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{request.department}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Globe className="mr-2 h-4 w-4" />
                          {request.destination}
                        </div>
                      </TableCell>
                      <TableCell>{request.travelDates}</TableCell>
                      <TableCell>{request.dataPackage}</TableCell>
                      <TableCell className="font-medium">{request.cost}</TableCell>
                      <TableCell>{getStatusBadge(request.status)}</TableCell>
                      <TableCell>
                        {request.status === "pending" ? (
                          <div className="flex gap-2">
                            <Button size="sm" className="bg-green-600 hover:bg-green-700">
                              <CheckCircle className="mr-1 h-3 w-3" />
                              Approve
                            </Button>
                            <Button size="sm" variant="destructive">
                              <XCircle className="mr-1 h-3 w-3" />
                              Reject
                            </Button>
                          </div>
                        ) : (
                          <Button variant="outline" size="sm">
                            View
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}