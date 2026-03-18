class RequestsController < ActionController::API
  before_action :authenticate_user!
  before_action :set_request_for_driver, only: %i[update]

  def index
    requests = PoolingRequest
               .includes(:requester, ride_offer: :route)
               .joins(ride_offer: :route)
               .where(routes: { user_id: current_user.id })

    grouped = requests.group_by(&:ride_offer)

    render json: grouped.map { |offer, reqs| serialize_group(offer, reqs) }
  end

  def my_index
    requests = PoolingRequest
               .includes(ride_offer: { route: :user })
               .where(requester_id: current_user.id)

    render json: requests.map { |r| serialize_my_request(r) }
  end

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
      create_notification!(
        user: @request.requester,
        type: "request_rejected",
        reference: @request
      )
      render json: serialize_request(@request)
    end
  rescue ActiveRecord::RecordInvalid => e
    render json: { errors: @request.errors.full_messages.presence || [e.message] }, status: :unprocessable_entity
  end

  def cancel
    request = PoolingRequest.find_by!(id: params[:id], requester_id: current_user.id)

    unless request.status == "pending"
      return render json: { errors: ["Only pending requests can be cancelled"] }, status: :unprocessable_entity
    end

    request.update!(status: "cancelled")

    render json: serialize_my_request(request)
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

  def set_request_for_driver
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

    create_notification!(
      user: @request.requester,
      type: "request_approved",
      reference: @request
    )
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

  def serialize_my_request(request)
    offer = request.ride_offer
    route = offer.route
    driver = route.user

    {
      id: request.id,
      ride_offer_id: offer.id,
      status: request.status,
      message: request.message,
      start_location: route.start_location,
      end_location: route.end_location,
      waypoints: route.waypoints,
      recurrence: route.recurrence,
      start_time: route.start_time&.strftime("%H:%M"),
      end_time: route.end_time&.strftime("%H:%M"),
      driver_name: driver.name,
      driver_email: driver.email
    }
  end

  def serialize_group(offer, requests)
    {
      ride_offer_id: offer.id,
      seats_available: offer.seats_available,
      start_location: offer.route.start_location,
      end_location: offer.route.end_location,
      waypoints: offer.route.waypoints,
      recurrence: offer.route.recurrence,
      start_time: offer.route.start_time&.strftime("%H:%M"),
      end_time: offer.route.end_time&.strftime("%H:%M"),
      requests: requests.map do |r|
        {
          id: r.id,
          requester_id: r.requester_id,
          requester_name: r.requester.name,
          requester_email: r.requester.email,
          message: r.message,
          status: r.status
        }
      end
    }
  end

  def create_notification!(user:, type:, reference:)
    notification = Notification.create!(
      user: user,
      type: type,
      reference: reference
    )
    SendNotificationEmailJob.perform_later(notification.id) if EmailNotifications.enabled?
    notification
  end
end

