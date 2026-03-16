module Authorization
  extend ActiveSupport::Concern

  private

  def require_org_admin!
    unless current_user&.admin_of?(current_organization)
      render json: { error: "Forbidden" }, status: :forbidden
    end
  end
end

