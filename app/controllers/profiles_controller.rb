class ProfilesController < ActionController::API
  before_action :authenticate_user!

  def show
    render json: serialize_user(current_user)
  end

  def update
    current_user.update!(profile_params)
    render json: serialize_user(current_user)
  end

  private

  def authenticate_user!
    token = bearer_token
    @current_user = User.find_by(session_token: token) if token.present?

    render json: { error: "Unauthorized" }, status: :unauthorized unless @current_user
  end

  def bearer_token
    auth_header = request.authorization.to_s
    scheme, token = auth_header.split(" ", 2)
    scheme&.casecmp("Bearer")&.zero? ? token : nil
  end

  def current_user
    @current_user
  end

  def profile_params
    params.require(:user).permit(:name, :email, :phone, :vehicle)
  end

  def serialize_user(user)
    {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      vehicle: user.vehicle
    }
  end
end

