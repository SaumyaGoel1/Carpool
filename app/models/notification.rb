class Notification < ApplicationRecord
  self.inheritance_column = :_type_disabled

  belongs_to :user
  belongs_to :reference, polymorphic: true, optional: true

  TYPES = %w[
    new_request_on_my_ride_offer
    request_approved
    request_rejected
  ].freeze

  validates :type, presence: true, inclusion: { in: TYPES }

  scope :unread, -> { where(read_at: nil) }
end
