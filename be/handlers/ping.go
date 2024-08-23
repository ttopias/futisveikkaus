package handlers

import (
	"net/http"

	"github.com/ttopias/futisveikkaus/be/utils"
)

type Ping struct {
	Message string `json:"message"`
}

// PingHandler handles the ping request and responds with a JSON message.
func PingHandler(w http.ResponseWriter, r *http.Request) {
	utils.RespondWithJSON(w, http.StatusOK, Ping{Message: "ok"})
}
