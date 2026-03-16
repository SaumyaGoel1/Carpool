class ProfilesController < ApiAuthController
  def show
    render json: serialize_user(current_user)
  end

  def update
    current_user.update!(profile_params)
    render json: serialize_user(current_user)
  end

  private

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

