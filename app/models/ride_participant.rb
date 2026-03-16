class RideParticipant < ApplicationRecord
  belongs_to :user
  belongs_to :ride_offer
end

