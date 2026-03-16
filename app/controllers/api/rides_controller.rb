# frozen_string_literal: true

module Api
  # GET /api/rides/offers — list active ride offers in current user's organization.
  # Only routes where offering=true, scoped to same org.
  class RidesController < Api::BaseController
    before_action :require_current_user

    def offers
      scope = Route
        .joins(:user)
        .where(users: { organization_id: current_organization.id }, offering: true)
        .where("routes.seats_available >= 1")

      scope = scope.where("routes.start_address ILIKE ?", "%#{Route.sanitize_sql_like(params[:from])}%") if params[:from].present?
      scope = scope.where("routes.end_address ILIKE ?", "%#{Route.sanitize_sql_like(params[:to])}%") if params[:to].present?
      scope = scope.where("routes.seats_available >= ?", params[:min_seats].to_i) if params[:min_seats].present?

      offers_list = scope.order("routes.updated_at DESC").includes(:user)

      render json: { offers: offers_list.map { |r| offer_response(r) } }
    end

    private

    def require_current_user
      head :unauthorized unless current_user
    end

    def offer_response(route)
      {
        id: route.id,
        start_address: route.start_address,
        end_address: route.end_address,
        recurrence: route.recurrence,
        departure_time: route.departure_time&.strftime("%H:%M"),
        arrival_time: route.arrival_time&.strftime("%H:%M"),
        seats_available: route.seats_available,
        driver: driver_response(route.user),
      }
    end

    def driver_response(user)
      { id: user.id, email: user.email, name: user.name }
    end
  end
end
