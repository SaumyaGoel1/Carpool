class Route < ApplicationRecord
  belongs_to :user
  belongs_to :organization
  has_many :ride_offers, dependent: :destroy

  validates :start_location, :end_location, presence: true
end

