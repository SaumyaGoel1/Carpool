# frozen_string_literal: true

require "test_helper"

module Api
  class OrganizationsTest < ActionDispatch::IntegrationTest
    def jwt_token(user)
      JWT.encode(
        { sub: user.id, exp: 7.days.from_now.to_i },
        ENV.fetch("JWT_SECRET", Rails.application.secret_key_base)
      )
    end

    test "GET /api/organization returns current org for any authenticated user" do
      org = Organization.create!(name: "Acme Corp")
      user = User.create!(email: "member@example.com", password: "secret123", organization: org)
      get api_organization_url, headers: { "Authorization" => "Bearer #{jwt_token(user)}" }
      assert_response :success
      assert_equal "Acme Corp", response.parsed_body["organization"]["name"]
    end

    test "PATCH /api/organization as admin updates org name" do
      org = Organization.create!(name: "Old Name")
      admin = User.create!(email: "admin@example.com", password: "secret123", organization: org, role: :admin)
      patch api_organization_url, params: { organization: { name: "New Name" } },
        headers: { "Authorization" => "Bearer #{jwt_token(admin)}" }, as: :json
      assert_response :success
      assert_equal "New Name", response.parsed_body["organization"]["name"]
      assert_equal "New Name", org.reload.name
    end

    test "PATCH /api/organization as member returns 403" do
      org = Organization.create!(name: "Acme")
      member = User.create!(email: "member@example.com", password: "secret123", organization: org, role: :member)
      patch api_organization_url, params: { organization: { name: "Hacked" } },
        headers: { "Authorization" => "Bearer #{jwt_token(member)}" }, as: :json
      assert_response :forbidden
      assert_equal "Acme", org.reload.name
    end

    test "GET /api/organization returns 401 without token" do
      get api_organization_url
      assert_response :unauthorized
    end
  end
end
