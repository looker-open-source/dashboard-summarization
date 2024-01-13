
project_name: "dashboard-summarization"

application: dashboard-summarization {
  label: "dashboard-summarization"
  url: "http://localhost:8080/bundle.js"
  # file: "bundle.js
  entitlements: {
    core_api_methods: ["me"] #Add more entitlements here as you develop new functionality
  }
}
