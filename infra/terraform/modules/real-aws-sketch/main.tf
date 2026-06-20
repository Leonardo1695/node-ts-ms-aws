# Real-AWS reference shapes only — kept commented to show IaC breadth without deploying.
# Uncomment and point the AWS provider at a real account to explore further (not used in Verdiron).

variable "project" {
  type = string
}

variable "environment" {
  type = string
}

variable "aws_region" {
  type = string
}

# resource "aws_vpc" "main" {
#   cidr_block           = "10.0.0.0/16"
#   enable_dns_support   = true
#   enable_dns_hostnames = true
#   tags = {
#     Name        = "${var.project}-${var.environment}-vpc"
#     Project     = var.project
#     Environment = var.environment
#   }
# }
#
# resource "aws_subnet" "public" {
#   vpc_id                  = aws_vpc.main.id
#   cidr_block              = "10.0.1.0/24"
#   map_public_ip_on_launch = true
#   availability_zone       = "${var.aws_region}a"
#   tags = {
#     Name = "${var.project}-${var.environment}-public-a"
#   }
# }
#
# resource "aws_security_group" "ecs_tasks" {
#   name        = "${var.project}-${var.environment}-ecs-tasks"
#   description = "Allow HTTP from ALB to ECS tasks"
#   vpc_id      = aws_vpc.main.id
#
#   ingress {
#     from_port   = 3000
#     to_port     = 3000
#     protocol    = "tcp"
#     cidr_blocks = ["10.0.0.0/16"]
#   }
#
#   egress {
#     from_port   = 0
#     to_port     = 0
#     protocol    = "-1"
#     cidr_blocks = ["0.0.0.0/0"]
#   }
# }
#
# resource "aws_ecs_cluster" "main" {
#   name = "${var.project}-${var.environment}-cluster"
# }
#
# resource "aws_ecs_task_definition" "api" {
#   family                   = "${var.project}-api"
#   requires_compatibilities = ["FARGATE"]
#   network_mode             = "awsvpc"
#   cpu                      = "256"
#   memory                   = "512"
#   execution_role_arn       = aws_iam_role.ecs_execution.arn
#   task_role_arn            = aws_iam_role.ecs_task.arn
#
#   container_definitions = jsonencode([
#     {
#       name  = "api-service"
#       image = "${var.project}/api-service:latest"
#       portMappings = [{ containerPort = 3003, hostPort = 3003, protocol = "tcp" }]
#       environment = [{ name = "NODE_ENV", value = "production" }]
#     }
#   ])
# }
#
# resource "aws_instance" "bastion" {
#   ami           = "ami-0c55b159cbfafe1f0"
#   instance_type = "t3.micro"
#   subnet_id     = aws_subnet.public.id
#   tags = {
#     Name = "${var.project}-${var.environment}-bastion"
#   }
# }
