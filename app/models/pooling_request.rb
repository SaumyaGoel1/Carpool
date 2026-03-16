class PoolingRequest < ApplicationRecord
  STATUSES = %w[pending approved rejected cancelled].freeze

  belongs_to :requester, class_name: "User"
  belongs_to :ride_offer

  validates :status, presence: true, inclusion: { in: STATUSES }
  validate :same_organization_as_driver
  validate :ride_has_available_seats
  validate :no_active_duplicate, on: :create

  private

  def same_organization_as_driver
    return unless requester && ride_offer

    org_id = ride_offer.route.organization_id

    requester_in_org = requester.memberships.exists?(organization_id: org_id)
    driver_in_org = ride_offer.route.user.memberships.exists?(organization_id: org_id)

    return if requester_in_org && driver_in_org

    errors.add(:base, "Requester and driver must be in the same organization")
  end

  def ride_has_available_seats
    return unless ride_offer

    if ride_offer.seats_available.to_i < 1
      errors.add(:base, "Ride has no seats remaining")
    end
  end

  def no_active_duplicate
    return unless requester && ride_offer

    if self.class.where(
         requester_id: requester_id,
         ride_offer_id: ride_offer_id,
         status: %w[pending approved]
       ).exists?
      errors.add(:base, "You already have an active request for this ride")
    end
  end
end

