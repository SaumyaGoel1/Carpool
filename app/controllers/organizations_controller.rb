class OrganizationsController < ActionController::API
  before_action :authenticate_user!
  before_action :set_organization
  before_action :require_org_admin!, only: [:update]

  # GET /api/organizations/:id or /api/organizations/current
  def show
    render json: serialize_organization(@organization)
  end

  # PATCH /api/organizations/:id or /api/organizations/current (admin only)
  def update
    @organization.update!(organization_params)
    render json: serialize_organization(@organization)
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
    org_id = params[:id]
    if org_id.to_s == "current"
      membership = current_user.memberships.includes(:organization).first
      unless membership
        render json: { error: "No organization" }, status: :not_found
        return
      end
      @organization = membership.organization
    else
      return unless ensure_member_of_organization!(org_id)
      @organization = Organization.find(org_id)
    end
  end

  def ensure_member_of_organization!(org_id)
    return true if current_user.memberships.exists?(organization_id: org_id)
    render json: { error: "Forbidden" }, status: :forbidden
    false
  end

  def require_org_admin!
    return if current_user&.admin_of?(@organization)
    render json: { error: "Forbidden" }, status: :forbidden
  end

  def organization_params
    params.require(:organization).permit(:name, :max_seats_per_offer, :visibility)
  end

  def serialize_organization(org)
    {
      id: org.id,
      name: org.name,
      max_seats_per_offer: org.max_seats_per_offer,
      visibility: org.visibility,
    }
  end
end
