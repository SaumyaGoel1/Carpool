# frozen_string_literal: true

class Organization < ApplicationRecord
  has_many :users, dependent: :restrict_with_error

  validates :name, presence: true
end
