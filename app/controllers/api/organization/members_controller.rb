# frozen_string_literal: true

module Api
  module Organization
    # GET /api/organization/members — users in current user's organization only.
    # All API queries are scoped by current_organization; only same-org users can pool.
    class MembersController < Api::BaseController
      before_action :require_current_user

      def index
        members = current_organization.users.order(:email)
        render json: { members: members.map { |u| member_response(u) } }
      end

      private

      def require_current_user
        head :unauthorized unless current_user
      end

      def member_response(user)
        { id: user.id, email: user.email, role: user.role }
      end
    end
  end
end
