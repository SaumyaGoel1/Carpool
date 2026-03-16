# frozen_string_literal: true

require "test_helper"

module Api
  module Organization
    class MembersTest < ActionDispatch::IntegrationTest
      test "GET /api/organization/members returns only users in current user org" do
        org1 = Organization.create!(name: "Org 1")
        org2 = Organization.create!(name: "Org 2")
        user1 = User.create!(email: "u1@example.com", password: "secret123", organization: org1)
        User.create!(email: "u2@example.com", password: "secret123", organization: org1)
        User.create!(email: "other@example.com", password: "secret123", organization: org2)

        token = JWT.encode(
          { sub: user1.id, exp: 7.days.from_now.to_i },
          ENV.fetch("JWT_SECRET", Rails.application.secret_key_base)
        )
        get api_organization_members_url, headers: { "Authorization" => "Bearer #{token}" }
        assert_response :success
        members = response.parsed_body["members"]
        assert_equal 2, members.size
        emails = members.map { |m| m["email"] }.sort
        assert_equal %w[u1@example.com u2@example.com], emails
      end

      test "GET /api/organization/members returns 401 without token" do
        get api_organization_members_url
        assert_response :unauthorized
      end
    end
  end
end
