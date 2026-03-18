class OrganizationInvitationsController < ActionController::API
  before_action :authenticate_user!
  before_action :set_organization
  before_action :require_org_admin!

  # POST /api/organizations/:id/invitations
  def create
    email = invitation_params[:email].to_s.downcase.strip
    role = invitation_params[:role].presence

    raw_token = SecureRandom.urlsafe_base64(32)
    digest = Digest::SHA256.hexdigest(raw_token)

    invitation = Invitation.create!(
      organization: @organization,
      email: email,
      role: role,
      token_digest: digest,
      status: "pending"
    )

    render json: {
      id: invitation.id,
      email: invitation.email,
      organization_id: invitation.organization_id,
      status: invitation.status,
      role: invitation.role,
      token: raw_token,
      accept_url: accept_url(raw_token)
    }, status: :created
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
    @organization = Organization.find(params[:id])
  end

  def require_org_admin!
    return if current_user&.admin_of?(@organization)

    render json: { error: "Forbidden" }, status: :forbidden
  end

  def invitation_params
    params.require(:invitation).permit(:email, :role)
  end

  def accept_url(raw_token)
    base = ENV.fetch("FRONTEND_ORIGIN", "http://localhost:5173")
    "#{base}/accept-invite?token=#{raw_token}"
  end
end

