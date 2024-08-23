package models

import (
	"database/sql"
	"time"
)

type Match struct {
	MatchID   int       `json:"match_id"`
	Date      string    `json:"date"`
	Time      string    `json:"time"`
	Stage     string    `json:"stage"`
	HomeID    int       `json:"home_id"`
	AwayID    int       `json:"away_id"`
	HomeGoals int       `json:"home_goals"`
	AwayGoals int       `json:"away_goals"`
	Finished  bool      `json:"finished"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func GetMatches(db *sql.DB) ([]Match, error) {
	rows, err := db.Query("SELECT match_id, date, time, stage, home_id, away_id, home_goals, away_goals, finished, created_at, updated_at FROM matches")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	matches := []Match{}
	for rows.Next() {
		var match Match
		if err := rows.Scan(&match.MatchID, &match.Date, &match.Time, &match.Stage, &match.HomeID, &match.AwayID, &match.HomeGoals, &match.AwayGoals, &match.Finished, &match.CreatedAt, &match.UpdatedAt); err != nil {
			return nil, err
		}
		matches = append(matches, match)
	}

	return matches, nil
}

func GetMatchByID(db *sql.DB, matchID int) (Match, error) {
	var match Match
	err := db.QueryRow("SELECT match_id, date, time, stage, home_id, away_id, home_goals, away_goals, finished, created_at, updated_at FROM matches WHERE match_id = $1", matchID).
		Scan(&match.MatchID, &match.Date, &match.Time, &match.Stage, &match.HomeID, &match.AwayID, &match.HomeGoals, &match.AwayGoals, &match.Finished, &match.CreatedAt, &match.UpdatedAt)
	if err != nil {
		if err == sql.ErrNoRows {
			return match, nil
		}
		return match, err
	}
	return match, nil
}

func CreateMatch(db *sql.DB, match Match) (int, error) {
	var matchID int
	err := db.QueryRow("INSERT INTO matches (date, time, stage, home_id, away_id, home_goals, away_goals, finished) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING match_id",
		match.Date, match.Time, match.Stage, match.HomeID, match.AwayID, match.HomeGoals, match.AwayGoals, match.Finished).Scan(&matchID)
	if err != nil {
		return 0, err
	}
	return matchID, nil
}

func UpdateMatch(db *sql.DB, match Match) error {
	_, err := db.Exec("UPDATE matches SET date = $1, time = $2, stage = $3, home_id = $4, away_id = $5, home_goals = $6, away_goals = $7, finished = $8, updated_at = $9 WHERE match_id = $10",
		match.Date, match.Time, match.Stage, match.HomeID, match.AwayID, match.HomeGoals, match.AwayGoals, match.Finished, time.Now(), match.MatchID)
	return err
}

func DeleteMatch(db *sql.DB, matchID int) error {
	_, err := db.Exec("DELETE FROM matches WHERE match_id = $1", matchID)
	return err
}
