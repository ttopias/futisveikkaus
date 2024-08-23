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

func GetTeamsHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		teams, err := models.GetTeams(db)
		if err != nil {
			utils.RespondWithError(w, http.StatusInternalServerError, "Failed to retrieve teams")
			return
		}
		utils.RespondWithJSON(w, http.StatusOK, teams)
	}
}

func GetTeamHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		claims, err := middleware.GetClaims(r)
		if err != nil || claims["role"] != "admin" {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		teamID, err := strconv.Atoi(r.URL.Path[len("/team/"):])
		if err != nil {
			utils.RespondWithError(w, http.StatusBadRequest, "Invalid team ID")
			return
		}

		team, err := models.GetTeamByID(db, teamID)
		if err != nil {
			utils.RespondWithError(w, http.StatusInternalServerError, "Failed to retrieve team")
			return
		}

		if team.TeamID == 0 {
			utils.RespondWithError(w, http.StatusNotFound, "Team not found")
			return
		}

		utils.RespondWithJSON(w, http.StatusOK, team)
	}
}

func CreateTeamHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		claims, err := middleware.GetClaims(r)
		if err != nil || claims["role"] != "admin" {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		var team models.Team
		if err := json.NewDecoder(r.Body).Decode(&team); err != nil {
			utils.RespondWithError(w, http.StatusBadRequest, "Invalid request payload")
			return
		}

		teamID, err := models.CreateTeam(db, team)
		if err != nil {
			utils.RespondWithError(w, http.StatusInternalServerError, "Failed to create team")
			return
		}

		utils.RespondWithJSON(w, http.StatusCreated, map[string]int{"team_id": teamID})
	}
}

func UpdateTeamHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		claims, err := middleware.GetClaims(r)
		if err != nil || claims["role"] != "admin" {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		teamID, err := strconv.Atoi(r.URL.Path[len("/team/update/"):])
		if err != nil {
			utils.RespondWithError(w, http.StatusBadRequest, "Invalid team ID")
			return
		}

		var team models.Team
		if err := json.NewDecoder(r.Body).Decode(&team); err != nil {
			utils.RespondWithError(w, http.StatusBadRequest, "Invalid request payload")
			return
		}
		team.TeamID = teamID

		if err := models.UpdateTeam(db, team); err != nil {
			utils.RespondWithError(w, http.StatusInternalServerError, "Failed to update team")
			return
		}

		utils.RespondWithJSON(w, http.StatusOK, map[string]string{"result": "success"})
	}
}

func DeleteTeamHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		claims, err := middleware.GetClaims(r)
		if err != nil || claims["role"] != "admin" {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		teamID, err := strconv.Atoi(r.URL.Path[len("/team/delete/"):])
		if err != nil {
			utils.RespondWithError(w, http.StatusBadRequest, "Invalid team ID")
			return
		}

		if err := models.DeleteTeam(db, teamID); err != nil {
			utils.RespondWithError(w, http.StatusInternalServerError, "Failed to delete team")
			return
		}

		utils.RespondWithJSON(w, http.StatusOK, map[string]string{"result": "success"})
	}
}
