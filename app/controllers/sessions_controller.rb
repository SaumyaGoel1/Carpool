class SessionsController < ApiAuthController
  def create
    user = User.find_by(email: params.dig(:user, :email))

    if user&.active? && user.authenticate(params.dig(:user, :password))
      user.regenerate_session_token
      membership = user.memberships.includes(:organization).first

      render json: {
        user: { id: user.id, email: user.email },
        organization_id: membership&.organization_id,
        role: membership&.role,
        session_token: user.session_token
      }, status: :ok
    else
      render json: { error: "Invalid email or password" }, status: :unauthorized
    end
  end
end

