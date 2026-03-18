module EmailNotifications
  module_function

  def enabled?
    raw = ENV.fetch("EMAIL_NOTIFICATIONS_ENABLED", "")
    %w[1 true yes on].include?(raw.to_s.strip.downcase)
  end
end

