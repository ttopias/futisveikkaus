package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/ttopias/futisveikkaus/be/middleware"
	"github.com/ttopias/futisveikkaus/be/models"
	"github.com/ttopias/futisveikkaus/be/utils"
)

func GetUsersHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		claims, err := middleware.GetClaims(r)
		if err != nil {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		if claims["role"] == "admin" {
			users, err := models.GetUsers(db)
			if err != nil {
				http.Error(w, "Error fetching users", http.StatusInternalServerError)
				return
			}

			json.NewEncoder(w).Encode(users)
		} else {
			userID, _ := strconv.Atoi(claims["user_id"].(string))
			user, err := models.GetUserByID(db, userID)
			if err != nil {
				http.Error(w, "Error fetching user", http.StatusInternalServerError)
				return
			}

			json.NewEncoder(w).Encode(user)
		}
	}
}

func GetUserHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		claims, err := middleware.GetClaims(r)
		if err != nil {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		userID, err := strconv.Atoi(r.URL.Path[len("/user/"):])
		if err != nil || (claims["role"] != "admin" && claims["user_id"] != userID) {
			utils.RespondWithError(w, http.StatusBadRequest, "Invalid request")
			return
		}

		user, err := models.GetUserByID(db, userID)
		if err != nil {
			utils.RespondWithError(w, http.StatusInternalServerError, "Failed to get user")
			return
		}

		if user.UserID == 0 {
			utils.RespondWithError(w, http.StatusNotFound, "User not found")
			return
		}

		utils.RespondWithJSON(w, http.StatusOK, user)
	}
}

func CreateUserHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var user models.User
		if err := json.NewDecoder(r.Body).Decode(&user); err != nil {
			utils.RespondWithError(w, http.StatusBadRequest, "Invalid request payload")
			return
		}

		userID, err := models.CreateUser(db, user)
		if err != nil {
			utils.RespondWithError(w, http.StatusInternalServerError, "Failed to create user")
			return
		}

		utils.RespondWithJSON(w, http.StatusCreated, map[string]int{"user_id": userID})
	}
}

func UpdateUserHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		claims, err := middleware.GetClaims(r)
		if err != nil {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		userID, err := strconv.Atoi(r.URL.Path[len("/user/update/"):])
		if err != nil || (claims["role"] != "admin" && claims["user_id"] != strconv.Itoa(userID)) {
			utils.RespondWithError(w, http.StatusBadRequest, "Invalid request")
			return
		}

		var user models.User
		if err := json.NewDecoder(r.Body).Decode(&user); err != nil {
			utils.RespondWithError(w, http.StatusBadRequest, "Invalid request payload")
			return
		}
		user.UserID = userID

		if err := models.UpdateUser(db, user); err != nil {
			utils.RespondWithError(w, http.StatusInternalServerError, "Failed to update user")
			return
		}

		utils.RespondWithJSON(w, http.StatusOK, map[string]string{"result": "success"})
	}
}

func DeleteUserHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		claims, err := middleware.GetClaims(r)
		if err != nil {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		userID, err := strconv.Atoi(r.URL.Path[len("/user/delete/"):])
		if err != nil || (claims["role"] != "admin" && claims["user_id"] != strconv.Itoa(userID)) {
			utils.RespondWithError(w, http.StatusBadRequest, "Invalid user ID")
			return
		}

		if err := models.DeleteUser(db, userID); err != nil {
			utils.RespondWithError(w, http.StatusInternalServerError, "Failed to delete user")
			return
		}

		utils.RespondWithJSON(w, http.StatusOK, map[string]string{"result": "success"})
	}
}
