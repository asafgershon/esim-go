# Railway Infrastructure Outputs

# Project Information
output "railway_project_id" {
  description = "Railway project ID"
  value       = railway_project.hiilo.id
}

output "railway_project_name" {
  description = "Railway project name"
  value       = railway_project.hiilo.name
}

# Environment Information
output "railway_environment_id" {
  description = "Production environment ID"
  value       = local.production_environment_id
}

# Service IDs (from manually created services + apollo-server from Terraform)
output "railway_service_ids" {
  description = "Railway service IDs"
  value = {
    apollo_server     = railway_service.apollo_server.id
    redis            = local.redis_id
    next_web_app     = local.next_web_app_id
    management_portal = local.management_portal_id
    workers          = local.workers_id
  }
}

# Service URLs
output "railway_service_urls" {
  description = "Railway service URLs"
  value = {
    api        = "https://api.hiiloworld.com"
    web        = "https://hiiloworld.com"
    management = "https://manage.hiiloworld.com"
    redis      = "redis.railway.internal:6379"
  }
}

# Internal URLs for service-to-service communication
output "railway_internal_urls" {
  description = "Internal Railway URLs for service-to-service communication"
  value = {
    apollo_server = "apollo-server.railway.internal"
    redis        = "redis.railway.internal"
  }
}

# Custom Domains (configured in Railway dashboard)
output "railway_custom_domains" {
  description = "Custom domains configured for services (managed in Railway dashboard)"
  value = {
    api        = "api.hiiloworld.com"
    web        = "hiiloworld.com"
    management = "manage.hiiloworld.com"
  }
}

# Environment Variables Count (for verification)
output "railway_variables_count" {
  description = "Number of environment variables configured per service"
  value = {
    apollo_server_prod = length(railway_variable.apollo_server_prod)
    apollo_server_dev  = length(railway_variable.apollo_server_dev)
    redis            = length(railway_variable.redis)
    next_web_app     = length(railway_variable.next_web_app)
    management_portal = length(railway_variable.management_portal)
  }
}