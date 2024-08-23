package models

import (
	"database/sql"
)

type User struct {
	UserID    int    `json:"user_id"`
	GroupID   int    `json:"group_id"`
	Email     string `json:"email"`
	Password  string `json:"password"`
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
	Points    int    `json:"points"`
	Role      string `json:"role"`
}

func GetUsers(db *sql.DB) ([]User, error) {
	rows, err := db.Query("SELECT user_id, group_id, email, first_name, last_name, points, role FROM users")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	users := []User{}
	for rows.Next() {
		var user User
		if err := rows.Scan(&user.UserID, &user.GroupID, &user.Email, &user.FirstName, &user.LastName, &user.Points, &user.Role); err != nil {
			return nil, err
		}
		users = append(users, user)
	}

	return users, nil
}

func GetUserByEmail(db *sql.DB, email string) (*User, error) {
	var user User
	err := db.QueryRow("SELECT user_id, email, password FROM users WHERE email = $1", email).Scan(&user.UserID, &user.Email, &user.Password)
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func GetUserByID(db *sql.DB, userID int) (User, error) {
	var user User
	err := db.QueryRow("SELECT user_id, group_id, email, first_name, last_name, points, role FROM users WHERE user_id = $1", userID).
		Scan(&user.UserID, &user.GroupID, &user.Email, &user.FirstName, &user.LastName, &user.Points, &user.Role)
	if err != nil {
		if err == sql.ErrNoRows {
			return user, nil
		}
		return user, err
	}
	return user, nil
}

func CreateUser(db *sql.DB, user User) (int, error) {
	var userID int
	err := db.QueryRow("INSERT INTO users (group_id, email, password, first_name, last_name, points, role) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING user_id",
		user.GroupID, user.Email, user.Password, user.FirstName, user.LastName, user.Points, user.Role).Scan(&userID)
	if err != nil {
		return 0, err
	}
	return userID, nil
}

func UpdateUser(db *sql.DB, user User) error {
	_, err := db.Exec("UPDATE users SET group_id = $1, email = $2, first_name = $3, last_name = $4, points = $5, role = $6 WHERE user_id = $7",
		user.GroupID, user.Email, user.FirstName, user.LastName, user.Points, user.Role, user.UserID)
	return err
}

func DeleteUser(db *sql.DB, userID int) error {
	_, err := db.Exec("DELETE FROM users WHERE user_id = $1", userID)
	return err
}
