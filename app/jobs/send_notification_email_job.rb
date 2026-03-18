class SendNotificationEmailJob < ApplicationJob
  queue_as :mailers

  def perform(notification_id)
    return unless EmailNotifications.enabled?

    notification = Notification.includes(reference: [{ ride_offer: { route: :user } }, :requester]).find_by(id: notification_id)
    return unless notification

    case notification.type
    when "new_request_on_my_ride_offer"
      request = notification.reference
      return unless request.is_a?(PoolingRequest)

      driver = notification.user
      NotificationMailer.with(driver: driver, request: request).new_request_on_ride_offer.deliver_now
    when "request_approved", "request_rejected"
      request = notification.reference
      return unless request.is_a?(PoolingRequest)

      requester = notification.user
      NotificationMailer.with(requester: requester, request: request).request_status_updated.deliver_now
    else
      # ignore unknown types
    end
  rescue => e
    Rails.logger.error(
      "[SendNotificationEmailJob] failed notification_id=#{notification_id} error=#{e.class}: #{e.message}"
    )
    Rails.logger.error(e.backtrace.join("\n")) if e.backtrace
  end
end

