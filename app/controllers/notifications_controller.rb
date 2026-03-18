class NotificationsController < ActionController::API
  before_action :authenticate_user!
  before_action :set_notification, only: %i[mark_read]

  def index
    notifications = current_user.notifications.order(created_at: :desc)
    render json: notifications.map { |n| serialize_notification(n) }
  end

  def mark_read
    @notification.update!(read_at: Time.current) unless @notification.read_at
    render json: serialize_notification(@notification)
  end

  def mark_all_read
    current_user.notifications.where(read_at: nil).update_all(read_at: Time.current)
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

  def set_notification
    @notification = current_user.notifications.find(params[:id])
  end

  def serialize_notification(notification)
    {
      id: notification.id,
      type: notification.type,
      reference_type: notification.reference_type,
      reference_id: notification.reference_id,
      read_at: notification.read_at&.iso8601,
      created_at: notification.created_at.iso8601
    }
  end
end

