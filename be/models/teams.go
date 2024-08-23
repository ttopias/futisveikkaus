package models

import (
	"database/sql"
	"time"
)

type Team struct {
	TeamID      int       `json:"team_id"`
	CountryCode string    `json:"country_code"`
	Name        string    `json:"name"`
	Group       string    `json:"group"`
	Win         int       `json:"win"`
	Draw        int       `json:"draw"`
	Loss        int       `json:"loss"`
	GF          int       `json:"gf"`
	GAA         int       `json:"gaa"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

func GetTeams(db *sql.DB) ([]Team, error) {
	rows, err := db.Query("SELECT team_id, country_code, name, \"group\", win, draw, loss, gf, gaa, created_at, updated_at FROM teams")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	teams := []Team{}
	for rows.Next() {
		var team Team
		if err := rows.Scan(&team.TeamID, &team.CountryCode, &team.Name, &team.Group, &team.Win, &team.Draw, &team.Loss, &team.GF, &team.GAA, &team.CreatedAt, &team.UpdatedAt); err != nil {
			return nil, err
		}
		teams = append(teams, team)
	}

	return teams, nil
}

func GetTeamByID(db *sql.DB, teamID int) (Team, error) {
	var team Team
	err := db.QueryRow("SELECT team_id, country_code, name, \"group\", win, draw, loss, gf, gaa, created_at, updated_at FROM teams WHERE team_id = $1", teamID).
		Scan(&team.TeamID, &team.CountryCode, &team.Name, &team.Group, &team.Win, &team.Draw, &team.Loss, &team.GF, &team.GAA, &team.CreatedAt, &team.UpdatedAt)
	if err != nil {
		if err == sql.ErrNoRows {
			return team, nil
		}
		return team, err
	}
	return team, nil
}

func CreateTeam(db *sql.DB, team Team) (int, error) {
	var teamID int
	err := db.QueryRow("INSERT INTO teams (country_code, name, \"group\", win, draw, loss, gf, gaa) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING team_id",
		team.CountryCode, team.Name, team.Group, team.Win, team.Draw, team.Loss, team.GF, team.GAA).Scan(&teamID)
	if err != nil {
		return 0, err
	}
	return teamID, nil
}

func UpdateTeam(db *sql.DB, team Team) error {
	_, err := db.Exec("UPDATE teams SET country_code = $1, name = $2, \"group\" = $3, win = $4, draw = $5, loss = $6, gf = $7, gaa = $8, updated_at = $9 WHERE team_id = $10",
		team.CountryCode, team.Name, team.Group, team.Win, team.Draw, team.Loss, team.GF, team.GAA, time.Now(), team.TeamID)
	return err
}

func DeleteTeam(db *sql.DB, teamID int) error {
	_, err := db.Exec("DELETE FROM teams WHERE team_id = $1", teamID)
	return err
}
