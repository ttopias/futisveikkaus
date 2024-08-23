package models

import (
	"database/sql"
	"time"
)

type Guess struct {
	GuessID          int       `json:"guess_id"`
	MatchID          int       `json:"match_id"`
	UserID           int       `json:"user_id"`
	HomeGoals        int       `json:"home_goals"`
	AwayGoals        int       `json:"away_goals"`
	Points           int       `json:"points"`
	PointsCalculated bool      `json:"points_calculated"`
	CreatedAt        time.Time `json:"created_at"`
	UpdatedAt        time.Time `json:"updated_at"`
}

func GetGuesses(db *sql.DB) ([]Guess, error) {
	rows, err := db.Query("SELECT guess_id, match_id, user_id, home_goals, away_goals, points, points_calculated, created_at, updated_at FROM guesses")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	guesses := []Guess{}
	for rows.Next() {
		var guess Guess
		if err := rows.Scan(&guess.GuessID, &guess.MatchID, &guess.UserID, &guess.HomeGoals, &guess.AwayGoals, &guess.Points, &guess.PointsCalculated, &guess.CreatedAt, &guess.UpdatedAt); err != nil {
			return nil, err
		}
		guesses = append(guesses, guess)
	}

	return guesses, nil
}

func GetGuessesByMatchID(db *sql.DB, matchID int) ([]Guess, error) {
	rows, err := db.Query("SELECT guess_id, match_id, user_id, home_goals, away_goals, points, points_calculated, created_at, updated_at FROM guesses WHERE match_id = $1", matchID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	guesses := []Guess{}
	for rows.Next() {
		var guess Guess
		if err := rows.Scan(&guess.GuessID, &guess.MatchID, &guess.UserID, &guess.HomeGoals, &guess.AwayGoals, &guess.Points, &guess.PointsCalculated, &guess.CreatedAt, &guess.UpdatedAt); err != nil {
			return nil, err
		}
		guesses = append(guesses, guess)
	}

	return guesses, nil
}

func GetGuessesByUserID(db *sql.DB, userID int) ([]Guess, error) {
	rows, err := db.Query("SELECT guess_id, match_id, user_id, home_goals, away_goals, points, points_calculated, created_at, updated_at FROM guesses WHERE user_id = $1", userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	guesses := []Guess{}
	for rows.Next() {
		var guess Guess
		if err := rows.Scan(&guess.GuessID, &guess.MatchID, &guess.UserID, &guess.HomeGoals, &guess.AwayGoals, &guess.Points, &guess.PointsCalculated, &guess.CreatedAt, &guess.UpdatedAt); err != nil {
			return nil, err
		}
		guesses = append(guesses, guess)
	}

	return guesses, nil
}

func GetGuessByID(db *sql.DB, guessID int) (Guess, error) {
	var guess Guess
	err := db.QueryRow("SELECT guess_id, match_id, user_id, home_goals, away_goals, points, points_calculated, created_at, updated_at FROM guesses WHERE guess_id = $1", guessID).
		Scan(&guess.GuessID, &guess.MatchID, &guess.UserID, &guess.HomeGoals, &guess.AwayGoals, &guess.Points, &guess.PointsCalculated, &guess.CreatedAt, &guess.UpdatedAt)
	if err != nil {
		if err == sql.ErrNoRows {
			return guess, nil
		}
		return guess, err
	}
	return guess, nil
}

func CreateGuess(db *sql.DB, guess Guess) (int, error) {
	var guessID int
	err := db.QueryRow("INSERT INTO guesses (match_id, user_id, home_goals, away_goals, points, points_calculated) VALUES ($1, $2, $3, $4, $5, $6) RETURNING guess_id",
		guess.MatchID, guess.UserID, guess.HomeGoals, guess.AwayGoals, guess.Points, guess.PointsCalculated).Scan(&guessID)
	if err != nil {
		return 0, err
	}
	return guessID, nil
}

func UpdateGuess(db *sql.DB, guess Guess) error {
	_, err := db.Exec("UPDATE guesses SET match_id = $1, user_id = $2, home_goals = $3, away_goals = $4, points = $5, points_calculated = $6, updated_at = $7 WHERE guess_id = $8",
		guess.MatchID, guess.UserID, guess.HomeGoals, guess.AwayGoals, guess.Points, guess.PointsCalculated, time.Now(), guess.GuessID)
	return err
}

func DeleteGuess(db *sql.DB, guessID int) error {
	_, err := db.Exec("DELETE FROM guesses WHERE guess_id = $1", guessID)
	return err
}
