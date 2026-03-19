class UsersController < ActionController::API
  before_action :authenticate_user!

  # PATCH /api/users/:id/deactivate
  def deactivate
    target = User.find(params[:id])

    org = current_user.memberships.includes(:organization).first&.organization
    return render json: { error: "Forbidden" }, status: :forbidden unless org

    return render json: { error: "Forbidden" }, status: :forbidden unless current_user.admin_of?(org)

    unless target.memberships.exists?(organization_id: org.id)
      return render json: { error: "Forbidden" }, status: :forbidden
    end

    if target.id == current_user.id
      return render json: { errors: ["You cannot deactivate yourself"] }, status: :unprocessable_entity
    end

    target.deactivate!
    target.regenerate_session_token

    render json: { user_id: target.id, active: target.active, deactivated_at: target.deactivated_at&.iso8601 }
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
end

