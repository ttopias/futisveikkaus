package main

import (
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/ttopias/futisveikkaus/be/handlers"
	"github.com/ttopias/futisveikkaus/be/middleware"
	"github.com/ttopias/futisveikkaus/be/models"
)

func CORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Allow requests from any origin (adjust this for production)
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if r.Method == http.MethodOptions {
			return
		}

		next.ServeHTTP(w, r)
	})
}

func main() {
	db := models.InitDB()
	defer db.Close()

	mux := http.NewServeMux()

	// Public
	mux.HandleFunc("/ping", handlers.PingHandler)
	mux.HandleFunc("/login", handlers.LoginHandler(db))
	mux.HandleFunc("/logout", handlers.LogoutHandler())
	mux.HandleFunc("/session", handlers.SessionHandler(db))
	mux.HandleFunc("/signup", handlers.SignupHandler(db))
	mux.HandleFunc("/matches", handlers.GetMatchesHandler(db))
	mux.HandleFunc("/teams", handlers.GetTeamsHandler(db))
	mux.HandleFunc("/user/create", handlers.CreateUserHandler(db))

	// Protected
	protectedMux := http.NewServeMux()

	protectedMux.HandleFunc("/user/", handlers.GetUserHandler(db))
	protectedMux.HandleFunc("/user/update/", handlers.UpdateUserHandler(db))

	protectedMux.HandleFunc("/guesses", handlers.GetGuessesHandler(db))
	protectedMux.HandleFunc("/guess/", handlers.GetGuessHandler(db))

	protectedMux.HandleFunc("/dashboard/", handlers.GetDashboardHandler(db))

	// Admin
	adminMux := http.NewServeMux()

	adminMux.HandleFunc("/admin/users", handlers.GetUsersHandler(db))
	adminMux.HandleFunc("/admin/user/", handlers.GetUserHandler(db))
	adminMux.HandleFunc("/admin/user/update/", handlers.UpdateUserHandler(db))
	adminMux.HandleFunc("/admin/user/delete/", handlers.DeleteUserHandler(db))

	adminMux.HandleFunc("/admin/match/", handlers.GetMatchHandler(db))
	adminMux.HandleFunc("/admin/match/create", handlers.CreateMatchHandler(db))
	adminMux.HandleFunc("/admin/match/update/", handlers.UpdateMatchHandler(db))
	adminMux.HandleFunc("/admin/match/delete/", handlers.DeleteMatchHandler(db))

	adminMux.HandleFunc("/admin/team/", handlers.GetTeamHandler(db))
	adminMux.HandleFunc("/admin/team/create", handlers.CreateTeamHandler(db))
	adminMux.HandleFunc("/admin/team/update/", handlers.UpdateTeamHandler(db))
	adminMux.HandleFunc("/admin/team/delete/", handlers.DeleteTeamHandler(db))

	adminMux.Handle("/", protectedMux)
	mux.Handle("/admin/", middleware.AdminMiddleware(adminMux))

	log.Fatal(http.ListenAndServe(fmt.Sprintf(":%s", os.Getenv("PORT")), CORS(mux)))
}
