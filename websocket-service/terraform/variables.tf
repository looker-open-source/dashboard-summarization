variable "project_id" {
  type = string
  default = "looker-private-demo"
}

variable "deployment_region" {
  type = string
  default = "us-central1"
}

variable "docker_image" {
    type = string
    default = "us-west2-docker.pkg.dev/looker-private-demo/websocket-service/websocket-service-image:tag1"
}

variable "cloud_run_service_name" {
    type = string
    default = "websocket-service"
}