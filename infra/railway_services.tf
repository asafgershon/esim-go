# Railway Services Configuration

# Apollo Server (GraphQL API)
# Import: terraform import railway_service.apollo_server 4afbf8ed-9842-4b63-afe9-239a1f0ed91c
resource "railway_service" "apollo_server" {
  name       = "apollo-server"
  project_id = railway_project.hiilo.id
  
  # Source configuration (assuming GitHub repo connection)
  source_repo = "yarinsa/esim-go"
  root_directory = "server/server"
  
  # Build and start commands are defined in railway.json or package.json
  
  # Enable regions and replicas as needed
  # regions = ["us-west-1"]
  # num_replicas = 1
}

# Redis Service
# Import: terraform import railway_service.redis <redis-service-id>
resource "railway_service" "redis" {
  name       = "redis"
  project_id = railway_project.hiilo.id
  
  # Using Railway's Redis template/image
  source_image = "redis:7-alpine"
  
  # Redis typically doesn't need replicas
  # num_replicas = 1
}

# Next.js Web Application
# Import: terraform import railway_service.next_web_app <service-id>
resource "railway_service" "next_web_app" {
  name       = "next-web-app"
  project_id = railway_project.hiilo.id
  
  source_repo = "yarinsa/esim-go"
  root_directory = "client/web-app"
}

# Management Portal
# Import: terraform import railway_service.management_portal <service-id>
resource "railway_service" "management_portal" {
  name       = "management-portal"
  project_id = railway_project.hiilo.id
  
  source_repo = "yarinsa/esim-go"
  root_directory = "client/dashboard"
}

# Note: Custom domains are configured in Railway dashboard
# The Railway Terraform provider doesn't currently support custom domain resources
# Domains configured:
# - api.hiiloworld.com -> apollo-server
# - hiiloworld.com -> next-web-app  
# - manage.hiiloworld.com -> management-portal