package middleware

import (
	"net/http"
	"os"

	"github.com/dgrijalva/jwt-go"
)

func GetClaims(r *http.Request) (map[string]interface{}, error) {
	cookie, err := r.Cookie("authToken")
	if err != nil {
		return nil, err
	}

	tokenString := cookie.Value
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, http.ErrNotSupported
		}
		return []byte(os.Getenv("JWT_SECRET")), nil
	})

	if err != nil || !token.Valid {
		return nil, err
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return nil, err
	}

	return claims, nil
}
