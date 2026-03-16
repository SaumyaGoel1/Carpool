# frozen_string_literal: true

module Api
  class BaseController < ActionController::API
    include JwtAuthenticatable

    # Current user from JWT (Authorization: Bearer <token>). Use in protected endpoints.
    def current_user
      @current_user ||= current_user_from_token
    end

    # Current user's organization. All API data is scoped to this org.
    def current_organization
      current_user&.organization
    end

    # Use in actions that only Admin can perform (invite, manage users, org settings).
    def require_admin
      head :forbidden unless current_user&.admin?
    end
  end
end
