# frozen_string_literal: true

class Route < ApplicationRecord
  belongs_to :user

  validates :start_address, presence: true
  validates :end_address, presence: true
  validates :recurrence, inclusion: { in: %w[daily weekdays weekly custom], allow_blank: true }
  validates :seats_available, numericality: { greater_than_or_equal_to: 0 }
  validate :seats_required_when_offering, if: :offering?

  private

  def seats_required_when_offering
    errors.add(:seats_available, "must be at least 1 when offering a ride") if seats_available.to_i < 1
  end
end
