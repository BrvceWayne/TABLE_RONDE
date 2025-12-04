# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[7.1].define(version: 2025_12_04_163341) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "plpgsql"

  create_table "preferences", force: :cascade do |t|
    t.text "dietary_restrictions"
    t.text "cuisine_types"
    t.integer "budget_min"
    t.integer "budget_max"
    t.integer "max_distance"
    t.string "ambiance"
    t.text "special_requests"
    t.bigint "user_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.float "latitude"
    t.float "longitude"
    t.string "address"
    t.index ["user_id"], name: "index_preferences_on_user_id"
  end

  create_table "restaurants", force: :cascade do |t|
    t.integer "rank"
    t.string "google_place_id"
    t.string "name"
    t.string "address"
    t.float "latitude"
    t.float "longitude"
    t.string "phone"
    t.text "ai_explanation"
    t.string "reservation_url"
    t.bigint "session_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.float "rating"
    t.integer "price_level"
    t.string "cuisine_type"
    t.string "photo_url"
    t.string "website"
    t.text "opening_hours"
    t.boolean "is_open_now"
    t.index ["session_id"], name: "index_restaurants_on_session_id"
  end

  create_table "session_users", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.bigint "session_id", null: false
    t.boolean "leader"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["session_id"], name: "index_session_users_on_session_id"
    t.index ["user_id"], name: "index_session_users_on_user_id"
  end

  create_table "sessions", force: :cascade do |t|
    t.string "share_code"
    t.string "meal_type"
    t.datetime "date"
    t.datetime "completed_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "users", force: :cascade do |t|
    t.string "email", default: "", null: false
    t.string "encrypted_password", default: "", null: false
    t.string "reset_password_token"
    t.datetime "reset_password_sent_at"
    t.datetime "remember_created_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.boolean "guest", default: false
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["reset_password_token"], name: "index_users_on_reset_password_token", unique: true
  end

  add_foreign_key "preferences", "users"
  add_foreign_key "restaurants", "sessions"
  add_foreign_key "session_users", "sessions"
  add_foreign_key "session_users", "users"
end
