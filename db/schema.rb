# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.0].define(version: 2026_03_17_060233) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "memberships", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.bigint "organization_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "role", default: "member", null: false
    t.index ["organization_id"], name: "index_memberships_on_organization_id"
    t.index ["user_id", "organization_id"], name: "index_memberships_on_user_id_and_organization_id", unique: true
    t.index ["user_id"], name: "index_memberships_on_user_id"
  end

  create_table "notifications", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.string "type", null: false
    t.string "reference_type"
    t.bigint "reference_id"
    t.datetime "read_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["reference_type", "reference_id"], name: "index_notifications_on_reference_type_and_reference_id"
    t.index ["user_id", "read_at"], name: "index_notifications_on_user_id_and_read_at"
    t.index ["user_id"], name: "index_notifications_on_user_id"
  end

  create_table "organizations", force: :cascade do |t|
    t.string "name", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["name"], name: "index_organizations_on_name", unique: true
  end

  create_table "pooling_requests", force: :cascade do |t|
    t.bigint "requester_id", null: false
    t.bigint "ride_offer_id", null: false
    t.string "status", default: "pending", null: false
    t.text "message"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["requester_id", "ride_offer_id", "status"], name: "index_pooling_requests_on_requester_offer_status"
    t.index ["requester_id"], name: "index_pooling_requests_on_requester_id"
    t.index ["ride_offer_id"], name: "index_pooling_requests_on_ride_offer_id"
  end

  create_table "products", force: :cascade do |t|
    t.string "name"
    t.integer "price"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "ride_offers", force: :cascade do |t|
    t.bigint "route_id", null: false
    t.integer "seats_available", default: 1, null: false
    t.boolean "active", default: true, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["route_id"], name: "index_ride_offers_on_route_id"
  end

  create_table "ride_participants", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.bigint "ride_offer_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["ride_offer_id"], name: "index_ride_participants_on_ride_offer_id"
    t.index ["user_id", "ride_offer_id"], name: "index_ride_participants_on_user_id_and_ride_offer_id", unique: true
    t.index ["user_id"], name: "index_ride_participants_on_user_id"
  end

  create_table "routes", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.bigint "organization_id", null: false
    t.string "start_location", null: false
    t.string "end_location", null: false
    t.text "waypoints"
    t.string "recurrence"
    t.time "start_time"
    t.time "end_time"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["organization_id"], name: "index_routes_on_organization_id"
    t.index ["user_id"], name: "index_routes_on_user_id"
  end

  create_table "users", force: :cascade do |t|
    t.string "email", null: false
    t.string "password_digest", null: false
    t.string "session_token", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "name"
    t.string "phone"
    t.string "vehicle"
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["session_token"], name: "index_users_on_session_token", unique: true
  end

  add_foreign_key "memberships", "organizations"
  add_foreign_key "memberships", "users"
  add_foreign_key "notifications", "users"
  add_foreign_key "pooling_requests", "ride_offers"
  add_foreign_key "pooling_requests", "users", column: "requester_id"
  add_foreign_key "ride_offers", "routes"
  add_foreign_key "ride_participants", "ride_offers"
  add_foreign_key "ride_participants", "users"
  add_foreign_key "routes", "organizations"
  add_foreign_key "routes", "users"
end
