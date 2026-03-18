class RideOffersController < ActionController::API
  before_action :authenticate_user!
  before_action :set_ride_offer, only: %i[update]

  def index
    offers = RideOffer
             .joins(route: :user)
             .where(routes: { organization_id: current_organization_id }, active: true)

    offers = apply_filters(offers)

    render json: offers.map { |offer| serialize_ride_offer(offer) }
  end

  def create
    route = current_user.routes.find_by!(
      id: ride_offer_params[:route_id],
      organization_id: current_organization_id
    )

    offer = RideOffer.new(
      route:,
      seats_available: ride_offer_params[:seats_available],
      active: ride_offer_params.key?(:active) ? ride_offer_params[:active] : true
    )
    offer.save!

    render json: serialize_ride_offer(offer), status: :created
  end

  def update
    @ride_offer.update!(ride_offer_params.slice(:seats_available, :active))
    render json: serialize_ride_offer(@ride_offer)
  end

  def requests_create
    offer = RideOffer
            .joins(:route)
            .where(
              routes: {
                organization_id: current_organization_id
              },
              active: true
            ).find(params[:ride_offer_id])

    request = PoolingRequest.new(
      requester: current_user,
      ride_offer: offer,
      message: request_params[:message],
      status: "pending"
    )

    if request.save
      create_notification!(
        user: offer.route.user,
        type: "new_request_on_my_ride_offer",
        reference: request
      )
      render json: serialize_request(request), status: :created
    else
      render json: { errors: request.errors.full_messages }, status: :unprocessable_entity
    end
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

  def current_organization_id
    return @current_organization_id if defined?(@current_organization_id)

    membership = @current_user&.memberships&.first

    if membership.nil?
      org = Organization.find_or_create_by!(name: "Default Org")
      membership = Membership.create!(user: @current_user, organization: org)
    end

    @current_organization_id = membership.organization_id
  end

  def set_ride_offer
    @ride_offer = RideOffer
                  .joins(:route)
                  .where(
                    routes: {
                      user_id: current_user.id,
                      organization_id: current_organization_id
                    }
                  ).find(params[:id])
  end

  def ride_offer_params
    params.require(:ride_offer).permit(
      :route_id,
      :seats_available,
      :active
    )
  end

  def request_params
    params.require(:request).permit(:message)
  end

  def serialize_ride_offer(offer)
    {
      id: offer.id,
      route_id: offer.route_id,
      seats_available: offer.seats_available,
      active: offer.active,
      driver_name: offer.route.user.name,
      driver_email: offer.route.user.email,
      start_location: offer.route.start_location,
      end_location: offer.route.end_location,
      waypoints: offer.route.waypoints,
      recurrence: offer.route.recurrence,
      start_time: offer.route.start_time&.strftime("%H:%M"),
      end_time: offer.route.end_time&.strftime("%H:%M")
    }
  end

  def apply_filters(scope)
    scope = filter_by_min_seats(scope)
    scope = filter_by_area(scope)
    scope = filter_by_schedule(scope)
    scope
  end

  def filter_by_min_seats(scope)
    return scope unless params[:min_seats].present?

    min = params[:min_seats].to_i
    return scope if min <= 0

    scope.where("ride_offers.seats_available >= ?", min)
  end

  def filter_by_area(scope)
    from = params[:from].to_s.strip
    to = params[:to].to_s.strip
    q = params[:q].to_s.strip

    return scope if from.empty? && to.empty? && q.empty?

    conditions = []
    values = []

    unless from.empty?
      conditions << "routes.start_location ILIKE ?"
      values << "%#{from}%"
    end

    unless to.empty?
      conditions << "routes.end_location ILIKE ?"
      values << "%#{to}%"
    end

    unless q.empty?
      conditions << "(routes.start_location ILIKE ? OR routes.end_location ILIKE ? OR COALESCE(routes.waypoints, '') ILIKE ?)"
      3.times { values << "%#{q}%" }
    end

    scope.where(conditions.join(" AND "), *values)
  end

  def filter_by_schedule(scope)
    if params[:date].present?
      date = begin
        Date.parse(params[:date])
      rescue ArgumentError
        nil
      end

      if date
        weekday = date.strftime("%A").downcase
        scope = scope.where("LOWER(COALESCE(routes.recurrence, '')) LIKE ?", "%#{weekday}%")
      end
    elsif params[:recurrence].present?
      term = params[:recurrence].to_s.downcase
      scope = scope.where("LOWER(COALESCE(routes.recurrence, '')) LIKE ?", "%#{term}%")
    end

    scope
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

