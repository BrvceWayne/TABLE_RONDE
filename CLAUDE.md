# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TABLE_RONDE is a Rails 7.1 application for collaborative restaurant selection. Users create dining sessions, invite others via share codes, submit preferences, and receive AI-powered restaurant recommendations based on collective preferences.

## Development Commands

```bash
# Setup
./bin/setup                          # Full setup: gems, db, logs

# Server
bin/rails server                     # Start dev server on localhost:3000

# Database
bin/rails db:migrate                 # Run migrations
bin/rails db:seed                    # Load seed data

# Testing
bin/rails test                       # Run all tests
bin/rails test test/models           # Model tests only
bin/rails test test/controllers      # Controller tests only
bin/rails test test/system           # System/browser tests
bin/rails test test/models/user_test.rb:15  # Single test by line number

# Console
bin/rails console                    # Interactive Rails console

# Code quality
rubocop                              # Run linter
rubocop -a                           # Auto-fix violations
```

## Architecture

### Core Models and Relationships

- **User** → has_one :preferences, has_many :sessions through :session_users
- **Session** → has_many :session_users, has_many :users, has_many :restaurants (identified by share_code)
- **SessionUser** → join table with :leader boolean flag
- **Preference** → belongs_to :user (stores dietary_restrictions, cuisine_types, budget, distance, ambiance)
- **Restaurant** → belongs_to :session (stores rank, google_place_id, coordinates, ai_explanation)

### Key Routes

Routes use `share_code` as the session identifier:
- `/sessions/:share_code` - Session dashboard
- `/sessions/:share_code/preferences` - User preference form
- `/sessions/:share_code/restaurants` - Recommendation results
- `/join/:share_code` - Join existing session
- `/dashboard` - User's sessions overview

### Authentication

Uses Devise with devise-guests gem. Supports:
- Registered users (email/password)
- Guest users (temporary access, can upgrade later)
- Leader role tracked via SessionUser#leader (only leaders generate recommendations)

### Pending Implementation

The following services need implementation:
- `GenerateRestaurantsService` - AI integration for recommendations (called in SessionsController#generate_recommendations and RestaurantsController#regenerate)

## Configuration

- Ruby 3.3.5 (via .ruby-version)
- PostgreSQL databases: `table_ronde_development`, `table_ronde_test`
- RuboCop configured with 120 char line limit
- Docker-ready for production deployment
