module OrganizationScoped
  extend ActiveSupport::Concern

  private

  def scoped_relation(model_class)
    if current_organization && model_class.column_names.include?("organization_id")
      model_class.where(organization_id: current_organization.id)
    else
      model_class.all
    end
  end
end

