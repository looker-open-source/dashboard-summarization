variable "project_id" {
  type = string
  default = "YOUR_PROJECT_ID"
}

variable "deployment_region" {
  type = string
  default = "YOUR_REGION"
}

variable "docker_image" {
    type = string
    default = "YOUR_DOCKER_IMAGE_URL"
}

variable "cloud_run_service_name" {
    type = string
    default = "dashboard-summary-service"
}

variable "genai_client_secret_value" {
  description = "The value for the GENAI_CLIENT_SECRET"
  type        = string
  sensitive   = true
  default = "YOUR VALUE"
}
