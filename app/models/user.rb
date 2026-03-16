# frozen_string_literal: true

class User < ApplicationRecord
  belongs_to :organization
  has_many :routes, dependent: :destroy

  has_secure_password

  enum :role, { member: "member", admin: "admin" }, default: :member

  validates :email, presence: true, uniqueness: { case_sensitive: false }
  validates :email, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :password, length: { minimum: 6 }, if: -> { password.present? }
end
