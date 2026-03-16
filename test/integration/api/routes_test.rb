# frozen_string_literal: true

require "test_helper"

module Api
  class RoutesTest < ActionDispatch::IntegrationTest
    def jwt_token(user)
      JWT.encode(
        { sub: user.id, exp: 7.days.from_now.to_i },
        ENV.fetch("JWT_SECRET", Rails.application.secret_key_base)
      )
    end

    setup do
      @org = Organization.create!(name: "Org")
      @user = User.create!(email: "u@example.com", password: "secret123", organization: @org)
      @headers = { "Authorization" => "Bearer #{jwt_token(@user)}" }
    end

    test "GET /api/routes returns current user routes only" do
      r1 = @user.routes.create!(start_address: "A", end_address: "B")
      other = User.create!(email: "other@example.com", password: "secret123", organization: @org)
      other.routes.create!(start_address: "X", end_address: "Y")

      get api_routes_url, headers: @headers
      assert_response :success
      ids = response.parsed_body["routes"].map { |r| r["id"] }
      assert_includes ids, r1.id
      assert_equal 1, ids.size
    end

    test "POST /api/routes creates route scoped to current user" do
      post api_routes_url, params: {
        route: {
          start_address: "Home",
          end_address: "Office",
          recurrence: "weekdays",
          departure_time: "08:00",
        }
      }, headers: @headers, as: :json
      assert_response :created
      data = response.parsed_body["route"]
      assert_equal "Home", data["start_address"]
      assert_equal "Office", data["end_address"]
      assert_equal "weekdays", data["recurrence"]
      assert_equal @user.id, Route.find(data["id"]).user_id
    end

    test "PATCH /api/routes updates only own route" do
      route = @user.routes.create!(start_address: "A", end_address: "B")
      patch api_route_url(route), params: {
        route: { start_address: "Updated Start" }
      }, headers: @headers, as: :json
      assert_response :success
      assert_equal "Updated Start", route.reload.start_address
    end

    test "DELETE /api/routes destroys only own route" do
      route = @user.routes.create!(start_address: "A", end_address: "B")
      delete api_route_url(route), headers: @headers
      assert_response :no_content
      assert_raises(ActiveRecord::RecordNotFound) { route.reload }
    end

    test "GET /api/routes returns 401 without token" do
      get api_routes_url
      assert_response :unauthorized
    end
  end
end
