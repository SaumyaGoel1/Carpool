class RideOffer < ApplicationRecord
  belongs_to :route

  delegate :organization_id, to: :route

  validates :seats_available, numericality: { only_integer: true, greater_than_or_equal_to: 1 }
end

