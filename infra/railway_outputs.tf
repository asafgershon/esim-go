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

# Service IDs
output "railway_service_ids" {
  description = "Railway service IDs"
  value = {
    apollo_server     = railway_service.apollo_server.id
    redis            = railway_service.redis.id
    next_web_app     = railway_service.next_web_app.id
    management_portal = railway_service.management_portal.id
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
    apollo_server     = length(railway_variable.apollo_server)
    redis            = length(railway_variable.redis)
    next_web_app     = length(railway_variable.next_web_app)
    management_portal = length(railway_variable.management_portal)
  }
}