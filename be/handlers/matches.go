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

func GetMatchesHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		matches, err := models.GetMatches(db)
		if err != nil {
			utils.RespondWithError(w, http.StatusInternalServerError, "Failed to retrieve matches")
			return
		}
		utils.RespondWithJSON(w, http.StatusOK, matches)
	}
}

func GetMatchHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		matchID, err := strconv.Atoi(r.URL.Path[len("/match/"):])
		if err != nil {
			utils.RespondWithError(w, http.StatusBadRequest, "Invalid match ID")
			return
		}

		match, err := models.GetMatchByID(db, matchID)
		if err != nil {
			utils.RespondWithError(w, http.StatusInternalServerError, "Failed to retrieve match")
			return
		}

		if match.MatchID == 0 {
			utils.RespondWithError(w, http.StatusNotFound, "Match not found")
			return
		}

		utils.RespondWithJSON(w, http.StatusOK, match)
	}
}

func CreateMatchHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		claims, err := middleware.GetClaims(r)
		if err != nil || claims["role"] != "admin" {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		var match models.Match
		if err := json.NewDecoder(r.Body).Decode(&match); err != nil {
			utils.RespondWithError(w, http.StatusBadRequest, "Invalid request payload")
			return
		}

		matchID, err := models.CreateMatch(db, match)
		if err != nil {
			utils.RespondWithError(w, http.StatusInternalServerError, "Failed to create match")
			return
		}

		utils.RespondWithJSON(w, http.StatusCreated, map[string]int{"match_id": matchID})
	}
}

func UpdateMatchHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		claims, err := middleware.GetClaims(r)
		if err != nil || claims["role"] != "admin" {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		matchID, err := strconv.Atoi(r.URL.Path[len("/match/update/"):])
		if err != nil {
			utils.RespondWithError(w, http.StatusBadRequest, "Invalid match ID")
			return
		}

		var match models.Match
		if err := json.NewDecoder(r.Body).Decode(&match); err != nil {
			utils.RespondWithError(w, http.StatusBadRequest, "Invalid request payload")
			return
		}
		match.MatchID = matchID

		if err := models.UpdateMatch(db, match); err != nil {
			utils.RespondWithError(w, http.StatusInternalServerError, "Failed to update match")
			return
		}

		utils.RespondWithJSON(w, http.StatusOK, map[string]string{"result": "success"})
	}
}

func DeleteMatchHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		claims, err := middleware.GetClaims(r)
		if err != nil || claims["role"] != "admin" {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		matchID, err := strconv.Atoi(r.URL.Path[len("/match/delete/"):])
		if err != nil {
			utils.RespondWithError(w, http.StatusBadRequest, "Invalid match ID")
			return
		}

		if err := models.DeleteMatch(db, matchID); err != nil {
			utils.RespondWithError(w, http.StatusInternalServerError, "Failed to delete match")
			return
		}

		utils.RespondWithJSON(w, http.StatusOK, map[string]string{"result": "success"})
	}
}
