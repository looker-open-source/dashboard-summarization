variable "project_id" {
  type = string
  default = ""
}

variable "deployment_region" {
  type = string
  default = ""
}

variable "docker_image" {
    type = string
    default = ""
}

variable "cloud_run_service_name" {
    type = string
    default = "websocket-service"
}
