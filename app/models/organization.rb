class Organization < ApplicationRecord
  VISIBILITY_OPTIONS = %w[organization public].freeze

  has_many :memberships, dependent: :destroy
  has_many :users, through: :memberships

  validates :name, presence: true, uniqueness: true
  validates :max_seats_per_offer, numericality: { only_integer: true, greater_than: 0, less_than_or_equal_to: 20 }, allow_nil: true
  validates :visibility, inclusion: { in: VISIBILITY_OPTIONS }, allow_nil: true
end


