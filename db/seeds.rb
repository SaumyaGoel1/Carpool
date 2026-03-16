# This file should ensure the existence of records required to run the application in every environment.
# Run with: bin/rails db:seed

org = Organization.find_or_create_by!(name: "Default")
# Ensure admin user exists and has known password (log in with admin@example.com / changeme123)
user = org.users.find_or_initialize_by(email: "admin@example.com")
user.password = "changeme123"
user.role = "admin"
user.save!
