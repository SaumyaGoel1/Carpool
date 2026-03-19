# CP-28: Ride & request history — past rides for drivers and passengers, with date filters.
class HistoryController < ActionController::API
  before_action :authenticate_user!

  def index
    from = parse_date(params[:from_date])
    to   = parse_date(params[:to_date])

    driver_rides = past_driver_rides(from, to)
    passenger_requests = past_passenger_requests(from, to)

    render json: {
      driver_rides: driver_rides.map { |offer| serialize_driver_ride(offer) },
      passenger_requests: passenger_requests.map { |req| serialize_passenger_request(req) }
    }
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

  def parse_date(str)
    return nil if str.blank?

    Date.parse(str.to_s)
  rescue ArgumentError
    nil
  end

  def past_driver_rides(from_date, to_date)
    scope = RideOffer
            .joins(:route)
            .where(routes: { user_id: current_user.id })
            .where(active: false)
            .includes(:route, pooling_requests: :requester)
            .order(updated_at: :desc)

    scope = scope.where("ride_offers.updated_at >= ?", from_date.beginning_of_day) if from_date
    scope = scope.where("ride_offers.updated_at <= ?", to_date.end_of_day) if to_date

    scope.to_a
  end

  def past_passenger_requests(from_date, to_date)
    scope = PoolingRequest
            .where(requester_id: current_user.id)
            .where.not(status: "pending")
            .includes(ride_offer: { route: :user })
            .order(updated_at: :desc)

    scope = scope.where("pooling_requests.updated_at >= ?", from_date.beginning_of_day) if from_date
    scope = scope.where("pooling_requests.updated_at <= ?", to_date.end_of_day) if to_date

    scope.to_a
  end

  def serialize_driver_ride(offer)
    route = offer.route
    {
      ride_offer_id: offer.id,
      route: {
        start_location: route.start_location,
        end_location: route.end_location,
        waypoints: route.waypoints,
        recurrence: route.recurrence,
        start_time: route.start_time&.strftime("%H:%M"),
        end_time: route.end_time&.strftime("%H:%M")
      },
      active: offer.active,
      updated_at: offer.updated_at.iso8601,
      participants: offer.pooling_requests.map do |req|
        {
          id: req.id,
          requester_name: req.requester.name,
          requester_email: req.requester.email,
          status: req.status
        }
      end
    }
  end

  def serialize_passenger_request(request)
    offer = request.ride_offer
    route = offer.route
    driver = route.user
    {
      id: request.id,
      ride_offer_id: offer.id,
      status: request.status,
      updated_at: request.updated_at.iso8601,
      route: {
        start_location: route.start_location,
        end_location: route.end_location,
        waypoints: route.waypoints,
        recurrence: route.recurrence,
        start_time: route.start_time&.strftime("%H:%M"),
        end_time: route.end_time&.strftime("%H:%M")
      },
      driver_name: driver.name,
      driver_email: driver.email
    }
  end
end
