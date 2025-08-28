# IAM user for Hiilo management in management account
resource "aws_iam_user" "hiilo_admin" {
  name = "hiilo-admin"
  path = "/"
  
  tags = {
    Purpose = "Hiilo account management"
  }
}

resource "aws_iam_user_policy_attachment" "hiilo_admin_policy" {
  user       = aws_iam_user.hiilo_admin.name
  policy_arn = "arn:aws:iam::aws:policy/AdministratorAccess"
}

# Policy to allow assuming role in Hiilo account
resource "aws_iam_policy" "assume_hiilo_role" {
  name        = "AssumeHiiloAccountRole"
  path        = "/"
  description = "Allow assuming OrganizationAccountAccessRole in Hiilo account"
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = "sts:AssumeRole"
        Resource = "arn:aws:iam::${local.hiilo_account_id}:role/OrganizationAccountAccessRole"
      }
    ]
  })
}

resource "aws_iam_user_policy_attachment" "hiilo_admin_assume_role" {
  user       = aws_iam_user.hiilo_admin.name
  policy_arn = aws_iam_policy.assume_hiilo_role.arn
}