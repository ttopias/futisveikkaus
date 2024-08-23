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

func GetGuessesHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		claims, err := middleware.GetClaims(r)
		if err != nil {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		if claims["role"] == "admin" {
			guesses, err := models.GetGuesses(db)
			if err != nil {
				utils.RespondWithError(w, http.StatusInternalServerError, "Failed to retrieve guesses")
				return
			}

			utils.RespondWithJSON(w, http.StatusOK, guesses)
		} else {
			userID, _ := strconv.Atoi(claims["user_id"].(string))
			guesses, err := models.GetGuessesByUserID(db, userID)
			if err != nil {
				utils.RespondWithError(w, http.StatusInternalServerError, "Failed to retrieve guesses")
				return
			}

			utils.RespondWithJSON(w, http.StatusOK, guesses)
		}
	}
}

func GetGuessHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		claims, err := middleware.GetClaims(r)
		if err != nil {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		guessID, err := strconv.Atoi(r.URL.Path[len("/guess/"):])
		if err != nil {
			utils.RespondWithError(w, http.StatusBadRequest, "Invalid guess ID")
			return
		}

		guess, err := models.GetGuessByID(db, guessID)
		if err != nil {
			utils.RespondWithError(w, http.StatusInternalServerError, "Failed to retrieve guess")
			return
		}

		if guess.GuessID == 0 || (claims["role"] != "admin" && claims["user_id"] != strconv.Itoa(guess.UserID)) {
			utils.RespondWithError(w, http.StatusNotFound, "Guess not found")
			return
		}

		utils.RespondWithJSON(w, http.StatusOK, guess)
	}
}

func CreateGuessHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var guess models.Guess
		if err := json.NewDecoder(r.Body).Decode(&guess); err != nil {
			utils.RespondWithError(w, http.StatusBadRequest, "Invalid request payload")
			return
		}

		guessID, err := models.CreateGuess(db, guess)
		if err != nil {
			utils.RespondWithError(w, http.StatusInternalServerError, "Failed to create guess")
			return
		}

		utils.RespondWithJSON(w, http.StatusCreated, map[string]int{"guess_id": guessID})
	}
}

func UpdateGuessHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		claims, err := middleware.GetClaims(r)
		if err != nil {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		guessID, err := strconv.Atoi(r.URL.Path[len("/guess/update/"):])
		if err != nil {
			utils.RespondWithError(w, http.StatusBadRequest, "Invalid guess ID")
			return
		}

		var guess models.Guess
		if err := json.NewDecoder(r.Body).Decode(&guess); err != nil {
			utils.RespondWithError(w, http.StatusBadRequest, "Invalid request payload")
			return
		}
		guess.GuessID = guessID

		if guess.GuessID == 0 || (claims["role"] != "admin" && claims["user_id"] != strconv.Itoa(guess.UserID)) {
			utils.RespondWithError(w, http.StatusNotFound, "Guess not found")
			return
		}

		if err := models.UpdateGuess(db, guess); err != nil {
			utils.RespondWithError(w, http.StatusInternalServerError, "Failed to update guess")
			return
		}

		utils.RespondWithJSON(w, http.StatusOK, map[string]string{"result": "success"})
	}
}

func DeleteGuessHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		claims, err := middleware.GetClaims(r)
		if err != nil || claims["role"] != "admin" {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		guessID, err := strconv.Atoi(r.URL.Path[len("/guess/delete/"):])
		if err != nil {
			utils.RespondWithError(w, http.StatusBadRequest, "Invalid guess ID")
			return
		}

		if err := models.DeleteGuess(db, guessID); err != nil {
			utils.RespondWithError(w, http.StatusInternalServerError, "Failed to delete guess")
			return
		}

		utils.RespondWithJSON(w, http.StatusOK, map[string]string{"result": "success"})
	}
}
