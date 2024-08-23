package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"os"

	"github.com/dgrijalva/jwt-go"
	"github.com/ttopias/futisveikkaus/be/models"
)

func SessionHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		cookie, err := r.Cookie("authToken")
		if err != nil {
			http.Error(w, "No auth token provided", http.StatusUnauthorized)
			return
		}

		tokenString := cookie.Value

		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, jwt.ErrSignatureInvalid
			}
			return os.Getenv("JWT_SECRET"), nil
		})

		if err != nil || !token.Valid {
			http.Error(w, "Invalid token", http.StatusUnauthorized)
			return
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			http.Error(w, "Invalid token claims", http.StatusUnauthorized)
			return
		}

		userID, ok := claims["user_id"].(float64)
		if !ok {
			http.Error(w, "Invalid user ID in token", http.StatusUnauthorized)
			return
		}

		user, err := models.GetUserByID(db, int(userID))
		if err != nil {
			http.Error(w, "Failed to retrieve user", http.StatusInternalServerError)
			return
		}

		session := map[string]interface{}{
			"session": "active",
			"user":    user,
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(session)
	}
}
