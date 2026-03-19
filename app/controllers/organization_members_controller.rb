class OrganizationMembersController < ActionController::API
  before_action :authenticate_user!
  before_action :set_organization
  before_action :require_org_admin!

  # GET /api/organizations/:id/members
  def index
    members = Membership
              .joins(:user)
              .where(organization_id: @organization.id)
              .order("users.email ASC")
              .includes(:user)

    render json: members.map { |m| serialize_member(m) }
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

  def set_organization
    org_id = params[:organization_id] || params[:id]
    if org_id.to_s == "current"
      membership = current_user.memberships.includes(:organization).first
      unless membership
        render json: { error: "No organization" }, status: :not_found
        return
      end
      @organization = membership.organization
    else
      @organization = Organization.find(org_id)
    end
  end

  def require_org_admin!
    return if current_user&.admin_of?(@organization)

    render json: { error: "Forbidden" }, status: :forbidden
  end

  def serialize_member(membership)
    user = membership.user
    {
      user_id: user.id,
      email: user.email,
      role: membership.role,
      active: user.active,
      deactivated_at: user.deactivated_at&.iso8601
    }
  end
end

