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
    default = "websocket-service"
}
