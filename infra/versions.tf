terraform {
  required_version = ">= 1.5.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    
    railway = {
      source  = "terraform-community-providers/railway"
      version = "~> 0.2.0"
    }
  }
  
  # Uncomment when ready to use remote backend
  # backend "s3" {
  #   bucket         = "yarinsasson-terraform-state"
  #   key            = "organizations/terraform.tfstate"
  #   region         = "us-east-1"
  #   encrypt        = true
  #   dynamodb_table = "terraform-state-lock"
  # }
}