# Changelog

## v2.1

### Added
 - Support for Lookml dashboards
 - Improved README

## v2.0

### Added
- Summary Styles; custom prompts with different styles for different personas like: executives, analysts, etc.
- Ability to regenerate query summaries with different prompts
- UI/UX modified with styled components

### Changed
- Changed Websocket service to RESTful service, so that backend endpoints can be secured OR private backend can be implemented
- Synchronous calls for tile summaries changed to async and run in parallel
- Backend secured with Looker server (user attribute + Cloud Secret)

## v1.1
###
- Refine option for shortening dashboard summary
  
## v1.0

### Added
- Dashboard summarization a la Vertex AI
- Websocket backend hosted on Cloud Run
- Export options to Slack and GChat