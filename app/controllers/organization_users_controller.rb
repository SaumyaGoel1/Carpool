class OrganizationUsersController < ApiAuthController
  before_action :require_org_admin!, only: %i[create destroy]

  def index
    users = current_organization ? current_organization.users : []
    render json: users.map { |u| { id: u.id, email: u.email } }
  end

  # Admin invites/adds an existing user to this org
  def create
    user = User.find_by!(email: params.require(:user).permit(:email)[:email])
    Membership.find_or_create_by!(user: user, organization: current_organization)
    render json: { message: "User added to organization" }, status: :created
  end

  def destroy
    membership = Membership.find_by!(user_id: params[:id], organization: current_organization)
    membership.destroy!
    head :no_content
  end
end

