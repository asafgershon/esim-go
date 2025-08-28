# Apollo Server Service - Critical Backend Service
# NOTE: After creating this service, you MUST manually:
# 1. Connect GitHub repository in Railway dashboard
# 2. Set root directory to /backend/server
# 3. Trigger initial deployment

resource "railway_service" "apollo_server" {
  name       = "apollo-server"
  project_id = railway_project.hiilo.id
  
  # Note: GitHub connection must be done manually
  # The provider cannot connect repositories
}

# Apollo Server Environment Variables - Production
resource "railway_variable" "apollo_server_prod" {
  for_each = merge(
    {
      NODE_ENV            = "production"
      LOG_LEVEL          = "info"
      RAILWAY_ENVIRONMENT = "production"
    },
    local.apollo_server_vars
  )
  
  name           = each.key
  value          = each.value
  environment_id = local.production_environment_id
  service_id     = railway_service.apollo_server.id
}

# Apollo Server Environment Variables - Development
resource "railway_variable" "apollo_server_dev" {
  for_each = merge(
    {
      NODE_ENV            = "development"
      LOG_LEVEL          = "debug"
      RAILWAY_ENVIRONMENT = "development"
    },
    local.apollo_server_vars_dev
  )
  
  name           = each.key
  value          = each.value
  environment_id = local.development_environment_id
  service_id     = railway_service.apollo_server.id
}