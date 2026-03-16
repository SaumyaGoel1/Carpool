# frozen_string_literal: true

require "test_helper"

module Api
  class ProfilesTest < ActionDispatch::IntegrationTest
    def jwt_token(user)
      JWT.encode(
        { sub: user.id, exp: 7.days.from_now.to_i },
        ENV.fetch("JWT_SECRET", Rails.application.secret_key_base)
      )
    end

    test "GET /api/profile returns current user profile" do
      org = Organization.create!(name: "Org")
      user = User.create!(email: "u@example.com", password: "secret123", organization: org, name: "Jane", phone: "+123")
      get api_profile_url, headers: { "Authorization" => "Bearer #{jwt_token(user)}" }
      assert_response :success
      profile = response.parsed_body["profile"]
      assert_equal "Jane", profile["name"]
      assert_equal "u@example.com", profile["email"]
      assert_equal "+123", profile["phone"]
      assert profile["vehicle"].nil? || profile["vehicle"].empty?
    end

    test "GET /api/profile includes vehicle when set" do
      org = Organization.create!(name: "Org")
      user = User.create!(
        email: "u@example.com", password: "secret123", organization: org,
        vehicle_make: "Toyota", vehicle_model: "Camry", vehicle_capacity: "4"
      )
      get api_profile_url, headers: { "Authorization" => "Bearer #{jwt_token(user)}" }
      assert_response :success
      vehicle = response.parsed_body["profile"]["vehicle"]
      assert_equal "Toyota", vehicle["make"]
      assert_equal "Camry", vehicle["model"]
      assert_equal "4", vehicle["capacity"]
    end

    test "PATCH /api/profile updates only current user profile" do
      org = Organization.create!(name: "Org")
      user = User.create!(email: "u@example.com", password: "secret123", organization: org)
      patch api_profile_url, params: {
        profile: { name: "Alice", phone: "555-1234", vehicle_make: "Honda", vehicle_model: "Civic", vehicle_capacity: "4" }
      }, headers: { "Authorization" => "Bearer #{jwt_token(user)}" }, as: :json
      assert_response :success
      user.reload
      assert_equal "Alice", user.name
      assert_equal "555-1234", user.phone
      assert_equal "Honda", user.vehicle_make
      assert_equal "Civic", user.vehicle_model
      assert_equal "4", user.vehicle_capacity
    end

    test "PATCH /api/profile returns 401 without token" do
      patch api_profile_url, params: { profile: { name: "X" } }, as: :json
      assert_response :unauthorized
    end

    test "GET /api/profile returns 401 without token" do
      get api_profile_url
      assert_response :unauthorized
    end
  end
end
