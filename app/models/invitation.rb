class Invitation < ApplicationRecord
  STATUSES = %w[pending accepted revoked].freeze
  ROLES = %w[member admin].freeze

  belongs_to :organization

  validates :email, presence: true, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :status, presence: true, inclusion: { in: STATUSES }
  validates :role, inclusion: { in: ROLES }, allow_nil: true
  validates :token_digest, presence: true, uniqueness: true

  scope :pending, -> { where(status: "pending") }

  def accept!
    update!(status: "accepted", accepted_at: Time.current)
  end

  def revoke!
    update!(status: "revoked")
  end
end

