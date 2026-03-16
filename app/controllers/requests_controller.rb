class RequestsController < ActionController::API
  before_action :authenticate_user!
  before_action :set_request, only: %i[update]

  def update
    new_status = request_params[:status]

    unless %w[approved rejected].include?(new_status)
      return render json: { errors: ["Status must be approved or rejected"] }, status: :unprocessable_entity
    end

    if @request.status.in?(%w[rejected cancelled])
      return render json: { errors: ["Cannot change a #{@request.status} request"] }, status: :unprocessable_entity
    end

    if new_status == "approved"
      approve_request!
    else
      @request.update!(status: "rejected")
      render json: serialize_request(@request)
    end
  rescue ActiveRecord::RecordInvalid => e
    render json: { errors: @request.errors.full_messages.presence || [e.message] }, status: :unprocessable_entity
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

  def set_request
    @request = PoolingRequest
               .joins(ride_offer: :route)
               .where(routes: { user_id: current_user.id })
               .find(params[:id])
  end

  def request_params
    params.require(:request).permit(:status)
  end

  def approve_request!
    PoolingRequest.transaction do
      @request.lock!
      offer = @request.ride_offer.lock!

      if offer.seats_available.to_i < 1
        @request.errors.add(:base, "No seats remaining")
        raise ActiveRecord::RecordInvalid, @request
      end

      @request.update!(status: "approved")
      offer.update!(seats_available: offer.seats_available - 1)

      RideParticipant.create!(
        user: @request.requester,
        ride_offer: offer
      )
    end

    render json: serialize_request(@request)
  end

  def serialize_request(request)
    {
      id: request.id,
      requester_id: request.requester_id,
      ride_offer_id: request.ride_offer_id,
      status: request.status,
      message: request.message
    }
  end
end

