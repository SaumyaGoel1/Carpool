# frozen_string_literal: true

module Api
  class AuthController < Api::BaseController
    # POST /api/sign_up
    def sign_up
      user = User.new(sign_up_params)
      if user.save
        render json: { token: encode_token(user.id), user: user_response(user) }, status: :created
      else
        render json: { errors: user.errors.full_messages }, status: :unprocessable_entity
      end
    end

    # POST /api/sign_in
    def sign_in
      user = User.find_by(email: sign_in_params[:email]&.downcase&.strip)
      if user&.authenticate(sign_in_params[:password])
        render json: { token: encode_token(user.id), user: user_response(user) }
      else
        render json: { error: "Invalid email or password" }, status: :unauthorized
      end
    end

    private

    def sign_up_params
      params.require(:user).permit(:email, :password, :password_confirmation, :organization_id)
    end

    def sign_in_params
      params.require(:user).permit(:email, :password)
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
