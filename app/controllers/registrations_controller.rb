class RegistrationsController < ApiAuthController
  def create
    user = User.new(user_params)
    user.save!
    user.regenerate_session_token

    render json: {
      user: { id: user.id, email: user.email },
      session_token: user.session_token
    }, status: :created
  end

  private

  def user_params
    params.require(:user).permit(:email, :password, :password_confirmation)
  end
end

