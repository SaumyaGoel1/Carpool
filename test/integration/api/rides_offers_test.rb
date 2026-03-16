# frozen_string_literal: true

require "test_helper"

module Api
  class RidesOffersTest < ActionDispatch::IntegrationTest
    def jwt_token(user)
      JWT.encode(
        { sub: user.id, exp: 7.days.from_now.to_i },
        ENV.fetch("JWT_SECRET", Rails.application.secret_key_base)
      )
    end

    test "GET /api/rides/offers returns active offers in current user org only" do
      org1 = Organization.create!(name: "Org 1")
      org2 = Organization.create!(name: "Org 2")
      user1 = User.create!(email: "u1@example.com", password: "secret123", organization: org1)
      user2 = User.create!(email: "u2@example.com", password: "secret123", organization: org1)
      user3 = User.create!(email: "u3@example.com", password: "secret123", organization: org2)

      r1 = user1.routes.create!(start_address: "A", end_address: "B", offering: true, seats_available: 2)
      user2.routes.create!(start_address: "C", end_address: "D", offering: true, seats_available: 1)
      user1.routes.create!(start_address: "E", end_address: "F", offering: false, seats_available: 0)
      user3.routes.create!(start_address: "X", end_address: "Y", offering: true, seats_available: 3)

      get api_rides_offers_url, headers: { "Authorization" => "Bearer #{jwt_token(user1)}" }
      assert_response :success
      offers = response.parsed_body["offers"]
      ids = offers.map { |o| o["id"] }
      assert_includes ids, r1.id
      assert_equal 2, ids.size
      assert offers.all? { |o| o["seats_available"] >= 1 }
    end

    test "GET /api/rides/offers returns 401 without token" do
      get api_rides_offers_url
      assert_response :unauthorized
    end
  end
end
