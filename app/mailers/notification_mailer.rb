class NotificationMailer < ApplicationMailer
  def new_request_on_ride_offer
    @driver = params.fetch(:driver)
    @request = params.fetch(:request)
    @offer = @request.ride_offer
    @route = @offer.route
    @requester = @request.requester

    mail(
      to: @driver.email,
      subject: "New ride request: #{@route.start_location} → #{@route.end_location}"
    )
  end

  def request_status_updated
    @requester = params.fetch(:requester)
    @request = params.fetch(:request)
    @offer = @request.ride_offer
    @route = @offer.route
    @driver = @route.user

    mail(
      to: @requester.email,
      subject: "Your ride request was #{@request.status}"
    )
  end
end

