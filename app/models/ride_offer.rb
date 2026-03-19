class RideOffer < ApplicationRecord
  belongs_to :route
  has_many :pooling_requests, dependent: :destroy
  has_many :ride_participants, dependent: :destroy

  delegate :organization_id, to: :route

  validates :seats_available, numericality: { only_integer: true, greater_than_or_equal_to: 1 }
end

