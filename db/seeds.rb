DEFAULT_ORG_NAME = ENV.fetch("DEFAULT_ORG_NAME", "Default Org")
SEED_PASSWORD = ENV.fetch("SEED_PASSWORD", "password12345")

DRIVER_EMAIL = ENV.fetch("DRIVER_EMAIL", "driver@gmail.com").downcase
RIDER_EMAIL = ENV.fetch("RIDER_EMAIL", "rider@gmail.com").downcase

org = Organization.find_or_create_by!(name: DEFAULT_ORG_NAME)

def ensure_user!(email:, password:)
  existing = User.find_by(email: email)
  return existing if existing

  User.create!(
    email: email,
    password: password,
    password_confirmation: password,
    active: true
  )
end

driver = ensure_user!(email: DRIVER_EMAIL, password: SEED_PASSWORD)
rider = ensure_user!(email: RIDER_EMAIL, password: SEED_PASSWORD)

# Default role is "member". If you want driver/rider to be org-admin, update role.
Membership.find_or_create_by!(user: driver, organization: org) do |m|
  m.role = "member"
end

Membership.find_or_create_by!(user: rider, organization: org) do |m|
  m.role = "member"
end

puts "Seeded users:"
puts "- driver: #{driver.email}"
puts "- rider:  #{rider.email}"
