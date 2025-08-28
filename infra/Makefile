# Terraform Infrastructure Makefile
# This file simplifies Terraform commands with environment-specific configurations

# Default environment
ENV ?= development

# Environment-specific tfvars file
TFVARS := environments/$(ENV).tfvars

# Check if tfvars file exists
check-env:
	@if [ ! -f "$(TFVARS)" ]; then \
		echo "Error: $(TFVARS) not found"; \
		echo "Available environments:"; \
		ls environments/*.tfvars 2>/dev/null | xargs -n1 basename | sed 's/.tfvars//' | sed 's/^/  - /'; \
		exit 1; \
	fi

# Initialize Terraform
init:
	terraform init

# Plan changes for specific environment
plan: check-env
	@echo "Planning for environment: $(ENV)"
	terraform plan -var-file="$(TFVARS)" -out=tfplan

# Apply changes for specific environment
apply: check-env
	@echo "Applying for environment: $(ENV)"
	terraform apply -var-file="$(TFVARS)"

# Apply saved plan
apply-saved:
	terraform apply tfplan

# Destroy infrastructure for specific environment
destroy: check-env
	@echo "Destroying for environment: $(ENV)"
	terraform destroy -var-file="$(TFVARS)"

# Format Terraform files
fmt:
	terraform fmt -recursive

# Validate configuration
validate:
	terraform validate

# Show current state
show:
	terraform show

# Import Railway resources
import-railway: check-env
	@echo "Importing Railway resources for environment: $(ENV)"
	./import_railway.sh

# Import SES resources
import-ses: check-env
	@echo "Importing SES resources"
	./import_ses.sh

# Development environment shortcuts
dev-plan:
	@$(MAKE) plan ENV=development

dev-apply:
	@$(MAKE) apply ENV=development

# Production environment shortcuts
prod-plan:
	@$(MAKE) plan ENV=production

prod-apply:
	@$(MAKE) apply ENV=production

# Clean up generated files
clean:
	rm -f tfplan
	rm -f *.tfstate*
	rm -f .terraform.lock.hcl
	rm -rf .terraform/

# Help
help:
	@echo "Terraform Infrastructure Management"
	@echo ""
	@echo "Usage:"
	@echo "  make <target> [ENV=<environment>]"
	@echo ""
	@echo "Targets:"
	@echo "  init          - Initialize Terraform"
	@echo "  plan          - Plan changes for environment (default: development)"
	@echo "  apply         - Apply changes for environment"
	@echo "  destroy       - Destroy infrastructure for environment"
	@echo "  validate      - Validate Terraform configuration"
	@echo "  fmt           - Format Terraform files"
	@echo "  show          - Show current state"
	@echo ""
	@echo "Import targets:"
	@echo "  import-railway - Import Railway resources"
	@echo "  import-ses    - Import SES resources"
	@echo ""
	@echo "Environment shortcuts:"
	@echo "  dev-plan      - Plan for development environment"
	@echo "  dev-apply     - Apply for development environment"
	@echo "  prod-plan     - Plan for production environment"  
	@echo "  prod-apply    - Apply for production environment"
	@echo ""
	@echo "Examples:"
	@echo "  make plan                    # Plan for development (default)"
	@echo "  make plan ENV=production     # Plan for production"
	@echo "  make apply ENV=production    # Apply for production"

.PHONY: check-env init plan apply apply-saved destroy fmt validate show import-railway import-ses dev-plan dev-apply prod-plan prod-apply clean help