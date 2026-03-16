# frozen_string_literal: true

module Api
  # GET /api/profile — current user profile (name, email, phone, vehicle).
  # PATCH /api/profile — update own profile only.
  class ProfilesController < Api::BaseController
    before_action :require_current_user

    def show
      render json: { profile: profile_response(current_user) }
    end

    def update
      if current_user.update(profile_params)
        render json: { profile: profile_response(current_user) }
      else
        render json: { errors: current_user.errors.full_messages }, status: :unprocessable_entity
      end
    end

    private

    def require_current_user
      head :unauthorized unless current_user
    end

    def profile_params
      params.require(:profile).permit(:name, :email, :phone, :vehicle_make, :vehicle_model, :vehicle_capacity)
    end

    def profile_response(user)
      {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        vehicle: vehicle_response(user),
        organization_id: user.organization_id,
        organization: org_response(user.organization),
      }
    end

    def vehicle_response(user)
      return nil if user.vehicle_make.blank? && user.vehicle_model.blank? && user.vehicle_capacity.blank?

      {
        make: user.vehicle_make,
        model: user.vehicle_model,
        capacity: user.vehicle_capacity,
      }
    end

    def org_response(org)
      return nil if org.blank?

      { id: org.id, name: org.name }
    end
  end
end
