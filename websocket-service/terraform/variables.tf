variable "project_id" {
  type = string
  default = "easymetrics-looker-assistant"
}

variable "deployment_region" {
  type = string
  default = "us-central1"
}

variable "docker_image" {
    type = string
    default = "us-central1-docker.pkg.dev/easymetrics-looker-assistant/dashboard-summarization-docker-repo/websocketserviceimage"
}

variable "cloud_run_service_name" {
    type = string
    default = "websocket-service"
}
