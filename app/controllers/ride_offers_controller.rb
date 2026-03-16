class RideOffersController < ActionController::API
  before_action :authenticate_user!
  before_action :set_ride_offer, only: %i[update]

  def index
    offers = RideOffer
             .joins(:route)
             .where(routes: { organization_id: current_organization_id }, active: true)

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

  def serialize_ride_offer(offer)
    {
      id: offer.id,
      route_id: offer.route_id,
      seats_available: offer.seats_available,
      active: offer.active
    }
  end
end

