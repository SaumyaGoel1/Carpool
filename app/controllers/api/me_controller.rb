# frozen_string_literal: true

module Api
  class MeController < Api::BaseController
    before_action :require_current_user

    # GET /api/me — current user from Authorization: Bearer <token>
    def show
      render json: { user: user_response(current_user) }
    end

    private

    def require_current_user
      head :unauthorized unless current_user
    end

    def user_response(user)
      { id: user.id, email: user.email, role: user.role, organization_id: user.organization_id, organization: org_response(user.organization) }
    end

    def org_response(org)
      return nil if org.blank?

      { id: org.id, name: org.name }
    end
  end
end
