# frozen_string_literal: true

require "test_helper"

module Api
  class AuthTest < ActionDispatch::IntegrationTest
    def create_org(name = "Test Org")
      Organization.create!(name: name)
    end

    test "POST /api/sign_up creates user and returns token with organization" do
      org = create_org
      post api_sign_up_url, params: {
        user: {
          email: "alice@example.com",
          password: "secret123",
          password_confirmation: "secret123",
          organization_id: org.id
        }
      }, as: :json
      assert_response :created
      json = response.parsed_body
      assert json["token"].present?
      assert_equal "alice@example.com", json["user"]["email"]
      assert_equal org.id, json["user"]["organization_id"]
      assert_equal org.name, json["user"]["organization"]["name"]
      assert_equal "member", json["user"]["role"]
    end

    test "POST /api/sign_up rejects invalid email" do
      org = create_org
      post api_sign_up_url, params: {
        user: {
          email: "invalid",
          password: "secret123",
          password_confirmation: "secret123",
          organization_id: org.id
        }
      }, as: :json
      assert_response :unprocessable_entity
      assert response.parsed_body["errors"].present?
    end

    test "POST /api/sign_in returns token for valid credentials" do
      org = create_org
      User.create!(email: "bob@example.com", password: "secret123", organization: org)
      post api_sign_in_url, params: {
        user: { email: "bob@example.com", password: "secret123" }
      }, as: :json
      assert_response :success
      json = response.parsed_body
      assert json["token"].present?
      assert_equal "bob@example.com", json["user"]["email"]
    end

    test "POST /api/sign_in returns 401 for invalid password" do
      org = create_org
      User.create!(email: "bob@example.com", password: "secret123", organization: org)
      post api_sign_in_url, params: {
        user: { email: "bob@example.com", password: "wrong" }
      }, as: :json
      assert_response :unauthorized
      assert_equal "Invalid email or password", response.parsed_body["error"]
    end

    test "GET /api/me returns user and organization when token valid" do
      org = create_org
      user = User.create!(email: "me@example.com", password: "secret123", organization: org)
      token = JWT.encode(
        { sub: user.id, exp: 7.days.from_now.to_i },
        ENV.fetch("JWT_SECRET", Rails.application.secret_key_base)
      )
      get api_me_url, headers: { "Authorization" => "Bearer #{token}" }
      assert_response :success
      assert_equal "me@example.com", response.parsed_body["user"]["email"]
      assert_equal org.id, response.parsed_body["user"]["organization_id"]
    end

    test "GET /api/me returns 401 without token" do
      get api_me_url
      assert_response :unauthorized
    end
  end
end
