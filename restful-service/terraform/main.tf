provider "google" {
  project = var.project_id
}

module "project-services" {
  source                      = "terraform-google-modules/project-factory/google//modules/project_services"
  version                     = "14.2.1"
  disable_services_on_destroy = false

  project_id  = var.project_id
  enable_apis = true

  activate_apis = [
    "cloudresourcemanager.googleapis.com", 
    "cloudapis.googleapis.com",
    "cloudbuild.googleapis.com",
    "run.googleapis.com",
    "run.googleapis.com",
    "iam.googleapis.com",
    "serviceusage.googleapis.com",
    "storage-api.googleapis.com",
    "storage.googleapis.com",
    "aiplatform.googleapis.com",
    "compute.googleapis.com",
    "secretmanager.googleapis.com" 
  ]
}

resource "time_sleep" "wait_after_apis_activate" {
  depends_on      = [module.project-services]
  create_duration = "300s"
}

# Create the secret
resource "google_secret_manager_secret" "genai_secret" {
  secret_id = "GENAI_CLIENT_SECRET"
  project   = var.project_id

  replication {
    automatic = true
  }
  depends_on = [module.project-services]
}

# Add the secret version - you'll need to update this with your actual secret value
resource "google_secret_manager_secret_version" "genai_secret_version" {
  secret      = google_secret_manager_secret.genai_secret.id
  secret_data = var.genai_client_secret_value
}

# Create service account for Cloud Run
resource "google_service_account" "cloud_run_sa" {
  account_id   = "dashboard-summary-sa"
  display_name = "Cloud Run Service Account for dashboard summary extension"
  project      = var.project_id
}

# Grant secret accessor role to the service account
resource "google_secret_manager_secret_iam_member" "secret_access" {
  secret_id = google_secret_manager_secret.genai_secret.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.cloud_run_sa.email}"
  project   = var.project_id
}

# Grant Cloud Run Invoker role to the service account
resource "google_project_iam_member" "cloud_run_invoker" {
  project = var.project_id
  role    = "roles/run.invoker"
  member  = "serviceAccount:${google_service_account.cloud_run_sa.email}"
}

# Grant Vertex AI User role to the service account
resource "google_project_iam_member" "vertex_ai_user" {
  project = var.project_id
  role    = "roles/aiplatform.user"
  member  = "serviceAccount:${google_service_account.cloud_run_sa.email}"
}

# Grant Vertex AI Service Agent role to the service account
resource "google_project_iam_member" "vertex_ai_service_agent" {
  project = var.project_id
  role    = "roles/aiplatform.serviceAgent"
  member  = "serviceAccount:${google_service_account.cloud_run_sa.email}"
}

resource "google_cloud_run_v2_service" "default" {
  name     = var.cloud_run_service_name
  location = var.deployment_region
  ingress = "INGRESS_TRAFFIC_ALL"

  template {
    scaling {
        max_instance_count = 20
        min_instance_count = 1
    }
    session_affinity = true
    timeout = "300s"
    max_instance_request_concurrency = 80

    service_account = google_service_account.cloud_run_sa.email

    containers {
        image = var.docker_image

        env {
          name = "PROJECT"
          value = var.project_id
        }

        env {
          name = "REGION"
          value = var.deployment_region
        }

        env {
          name = "GENAI_CLIENT_SECRET"
          value_source {
            secret_key_ref {
              secret = google_secret_manager_secret.genai_secret.secret_id
              version = "latest"
            }
          }
        }

        resources {
            limits = {
                cpu = 1
                memory = "1024Mi"
            }
        }
    }
  }
  depends_on = [google_secret_manager_secret_version.genai_secret_version]
}

data "google_iam_policy" "noauth" {
  binding {
    role = "roles/run.invoker"
    members = [
      "allUsers",
    ]
  }
}

resource "google_cloud_run_v2_service_iam_policy" "noauth" {
  location    = var.deployment_region
  project     = var.project_id
  name     = var.cloud_run_service_name

  policy_data = data.google_iam_policy.noauth.policy_data
  depends_on  = [google_cloud_run_v2_service.default]
}

# Return service URL
output "url" {
  value = "${google_cloud_run_v2_service.default.uri}"
}