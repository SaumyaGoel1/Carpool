class Route < ApplicationRecord
  belongs_to :user
  belongs_to :organization

  validates :start_location, :end_location, presence: true
end

