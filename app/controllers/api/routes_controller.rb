# frozen_string_literal: true

module Api
  # CRUD for current user's routes. All scoped to current_user and organization.
  class RoutesController < Api::BaseController
    before_action :require_current_user
    before_action :set_route, only: [:show, :update, :destroy]

    def index
      routes = current_user.routes.order(created_at: :desc)
      render json: { routes: routes.map { |r| route_response(r) } }
    end

    def show
      render json: { route: route_response(@route) }
    end

    def create
      route = current_user.routes.build(route_params)
      if route.save
        render json: { route: route_response(route) }, status: :created
      else
        render json: { errors: route.errors.full_messages }, status: :unprocessable_entity
      end
    end

    def update
      if @route.update(route_params)
        render json: { route: route_response(@route) }
      else
        render json: { errors: @route.errors.full_messages }, status: :unprocessable_entity
      end
    end

    def destroy
      @route.destroy
      head :no_content
    end

    private

    def require_current_user
      head :unauthorized unless current_user
    end

    def set_route
      @route = current_user.routes.find(params[:id])
    end

    def route_params
      params.require(:route).permit(
        :start_address, :start_lat, :start_lng,
        :end_address, :end_lat, :end_lng,
        :recurrence, :departure_time, :arrival_time,
        :offering, :seats_available,
        waypoints: []
      )
    end

    def route_response(r)
      {
        id: r.id,
        start_address: r.start_address,
        start_lat: r.start_lat&.to_f,
        start_lng: r.start_lng&.to_f,
        end_address: r.end_address,
        end_lat: r.end_lat&.to_f,
        end_lng: r.end_lng&.to_f,
        waypoints: r.waypoints || [],
        recurrence: r.recurrence,
        departure_time: r.departure_time&.strftime("%H:%M"),
        arrival_time: r.arrival_time&.strftime("%H:%M"),
        offering: r.offering?,
        seats_available: r.seats_available,
        created_at: r.created_at.iso8601,
        updated_at: r.updated_at.iso8601,
      }
    end
  end
end
