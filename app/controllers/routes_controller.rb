class RoutesController < ActionController::API
  before_action :authenticate_user!
  before_action :set_route, only: %i[show update destroy]

  def index
    routes = current_user.routes.where(organization_id: current_organization_id)
    render json: routes.map { |r| serialize_route(r) }
  end

  def show
    render json: serialize_route(@route)
  end

  def create
    route = Route.new(route_params)
    route.user = current_user
    route.organization_id = current_organization_id
    route.save!

    render json: serialize_route(route), status: :created
  end

  def update
    @route.update!(route_params)
    render json: serialize_route(@route)
  end

  def destroy
    @route.destroy!
    head :no_content
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
    @current_user&.memberships&.first&.organization_id
  end

  def set_route
    @route = current_user.routes.find_by!(id: params[:id], organization_id: current_organization_id)
  end

  def route_params
    params.require(:route).permit(
      :start_location,
      :end_location,
      :waypoints,
      :recurrence,
      :start_time,
      :end_time
    )
  end

  def serialize_route(route)
    {
      id: route.id,
      start_location: route.start_location,
      end_location: route.end_location,
      waypoints: route.waypoints,
      recurrence: route.recurrence,
      start_time: route.start_time&.strftime("%H:%M"),
      end_time: route.end_time&.strftime("%H:%M")
    }
  end
end

