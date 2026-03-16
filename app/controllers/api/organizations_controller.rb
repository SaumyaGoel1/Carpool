# frozen_string_literal: true

module Api
  # GET /api/organization — current org (any authenticated user).
  # PATCH /api/organization — update org (Admin only).
  class OrganizationsController < Api::BaseController
    before_action :require_current_user
    before_action :require_admin, only: [:update]

    def show
      render json: { organization: org_response(current_organization) }
    end

    def update
      if current_organization.update(organization_params)
        render json: { organization: org_response(current_organization) }
      else
        render json: { errors: current_organization.errors.full_messages }, status: :unprocessable_entity
      end
    end

    private

    def require_current_user
      head :unauthorized unless current_user
    end

    def organization_params
      params.require(:organization).permit(:name)
    end

    def org_response(org)
      return nil if org.blank?

      { id: org.id, name: org.name }
    end
  end
end
