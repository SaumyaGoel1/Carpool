# Allow frontend (React on 5173 / 8080) to call the API from the browser.
# Origins from env or defaults for dev (localhost) and common prod patterns.
require "rack/cors"

Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins_env = ENV.fetch("CORS_ORIGINS", "http://localhost:5173 http://localhost:8080 http://127.0.0.1:5173 http://127.0.0.1:8080")
    origins(*origins_env.split.map(&:strip))
    resource "*",
             headers: :any,
             methods: %i[get post put patch delete options head]
  end
end
