package handlers

import (
	"database/sql"
	"net/http"
	"strconv"

	"github.com/ttopias/futisveikkaus/be/models"
	"github.com/ttopias/futisveikkaus/be/utils"
)

func GetDashboardHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		groupID, err := strconv.Atoi(r.URL.Path[len("/dashboard/"):])
		if err != nil {
			utils.RespondWithError(w, http.StatusBadRequest, "Invalid group ID")
			return
		}
		guesses, err := models.GetDashboard(db, groupID)
		if err != nil {
			utils.RespondWithError(w, http.StatusInternalServerError, "Failed to retrieve view")
			return
		}
		utils.RespondWithJSON(w, http.StatusOK, guesses)
	}
}
