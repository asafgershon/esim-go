# Import existing organization
# terraform import aws_organizations_organization.main o-gs0qfk09ws

resource "aws_organizations_organization" "main" {
  feature_set = "ALL"
  
  enabled_policy_types = [
    "SERVICE_CONTROL_POLICY"
  ]
}