class InvitationsController < ActionController::API
  # POST /api/invitations/accept
  # body: { token: "...", user: { password: "..." } } (password required only if user doesn't exist)
  def accept
    raw_token = params.require(:token).to_s
    digest = Digest::SHA256.hexdigest(raw_token)

    invitation = Invitation.find_by(token_digest: digest)
    return render json: { error: "Invalid token" }, status: :not_found unless invitation

    unless invitation.status == "pending"
      return render json: { error: "Invitation is #{invitation.status}" }, status: :unprocessable_entity
    end

    user = User.find_by(email: invitation.email)
    created = false

    User.transaction do
      if user.nil?
        password = params.dig(:user, :password).to_s
        if password.length < 8
          return render json: { errors: ["Password must be at least 8 characters"] }, status: :unprocessable_entity
        end

        user = User.create!(email: invitation.email, password: password, password_confirmation: password)
        created = true
      end

      Membership.find_or_create_by!(user: user, organization: invitation.organization) do |m|
        m.role = invitation.role.presence || "member"
      end

      invitation.accept!
      user.regenerate_session_token
    end

    render json: {
      user: { id: user.id, email: user.email },
      organization: { id: invitation.organization.id, name: invitation.organization.name },
      session_token: user.session_token,
      user_created: created
    }
  end
end

