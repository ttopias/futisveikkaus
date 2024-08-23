package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"

	"github.com/ttopias/futisveikkaus/be/models"

	"golang.org/x/crypto/bcrypt"
)

type SignupRequest struct {
	Email     string `json:"email"`
	Password  string `json:"password"`
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
	GroupID   int    `json:"group_id"`
}

// SignupHandler handles the user registration process
func SignupHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req SignupRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid request payload", http.StatusBadRequest)
			return
		}

		existingUser, err := models.GetUserByEmail(db, req.Email)
		if err == nil && existingUser != nil {
			http.Error(w, "Email already in use", http.StatusConflict)
			return
		}

		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
		if err != nil {
			http.Error(w, "Could not hash password", http.StatusInternalServerError)
			return
		}

		userData := models.User{
			Email:     req.Email,
			Password:  string(hashedPassword),
			FirstName: req.FirstName,
			LastName:  req.LastName,
			GroupID:   req.GroupID,
		}

		id, err := models.CreateUser(db, userData)
		if err != nil && id > 0 {
			http.Error(w, "Could not create user", http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusCreated)
		w.Write([]byte(`{"message":"User created successfully"}`))
	}
}
