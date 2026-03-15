# syntax=docker/dockerfile:1
# check=error=true

# Supports both development and production:
#
# Production (default):
#   docker build -t app .
#   docker run -d -p 80:80 -e RAILS_MASTER_KEY=<value> --name app app
#
# Development (use with docker-compose or explicitly):
#   docker build --target development --build-arg RAILS_ENV=development -t app:dev .
#   docker run -it -p 3000:3000 -v $(pwd):/rails -e RAILS_ENV=development app:dev

# Make sure RUBY_VERSION matches the Ruby version in .ruby-version
ARG RUBY_VERSION=3.4.1
FROM docker.io/library/ruby:$RUBY_VERSION-slim AS base

# Rails app lives here
WORKDIR /rails

# Install base packages
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y curl libjemalloc2 libvips postgresql-client && \
    rm -rf /var/lib/apt/lists /var/cache/apt/archives

# Build stage: install gems and optionally precompile assets
FROM base AS build

# RAILS_ENV controls bundle install and asset precompilation (production vs development)
ARG RAILS_ENV=production
ENV RAILS_ENV=$RAILS_ENV

# Production: frozen install without dev/test gems. Development: install all gems.
ENV BUNDLE_PATH="/usr/local/bundle"

# Install packages needed to build gems
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y build-essential git libpq-dev libyaml-dev pkg-config && \
    rm -rf /var/lib/apt/lists /var/cache/apt/archives

# Install application gems
COPY Gemfile Gemfile.lock ./
RUN if [ "$RAILS_ENV" = "production" ]; then \
      bundle install --without development test && \
      rm -rf ~/.bundle/ "${BUNDLE_PATH}"/ruby/*/cache "${BUNDLE_PATH}"/ruby/*/bundler/gems/*/.git && \
      bundle exec bootsnap precompile --gemfile; \
    else \
      bundle install && \
      rm -rf ~/.bundle/ "${BUNDLE_PATH}"/ruby/*/cache "${BUNDLE_PATH}"/ruby/*/bundler/gems/*/.git && \
      bundle exec bootsnap precompile --gemfile; \
    fi

# Copy application code (needed for bootsnap precompile and production assets)
COPY . .

# Precompile bootsnap code for faster boot times
RUN bundle exec bootsnap precompile app/ lib/

# Precompile assets only in production
RUN if [ "$RAILS_ENV" = "production" ]; then \
      SECRET_KEY_BASE_DUMMY=1 ./bin/rails assets:precompile; \
    fi

# =============================================================================
# Development target: gems + entrypoint only; app code comes from volume mount
# =============================================================================
FROM base AS development

ARG RAILS_ENV=development
ENV RAILS_ENV=$RAILS_ENV \
    BUNDLE_PATH="/usr/local/bundle"

# Copy gems and entrypoint from build stage (app code will be mounted at /rails)
COPY --from=build "${BUNDLE_PATH}" "${BUNDLE_PATH}"
COPY --from=build /rails/bin/docker-entrypoint /rails/bin/docker-entrypoint

ENV PATH="${BUNDLE_PATH}/bin:${PATH}"

# Run as root in dev to avoid volume mount permission issues
EXPOSE 3000
ENTRYPOINT ["/rails/bin/docker-entrypoint"]
CMD ["./bin/rails", "server", "-b", "0.0.0.0", "-p", "3000"]

# =============================================================================
# Production target: minimal image, non-root user, Thruster on port 80
# =============================================================================
FROM base AS production

ENV RAILS_ENV="production" \
    BUNDLE_DEPLOYMENT="1" \
    BUNDLE_PATH="/usr/local/bundle" \
    BUNDLE_WITHOUT="development"

# Copy built artifacts: gems, application
COPY --from=build "${BUNDLE_PATH}" "${BUNDLE_PATH}"
COPY --from=build /rails /rails

ENV PATH="${BUNDLE_PATH}/bin:${PATH}"

# Run as non-root user for security
RUN groupadd --system --gid 1000 rails && \
    useradd rails --uid 1000 --gid 1000 --create-home --shell /bin/bash && \
    chown -R rails:rails db log storage tmp
USER 1000:1000

ENTRYPOINT ["/rails/bin/docker-entrypoint"]
EXPOSE 80
CMD ["./bin/thrust", "./bin/rails", "server"]
