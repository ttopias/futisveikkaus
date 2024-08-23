package models

import (
	"database/sql"
)

type Dashboard struct {
	GroupID     int    `json:"group_id"`
	UserID      int    `json:"user_id"`
	FirstName   string `json:"first_name"`
	LastName    string `json:"last_name"`
	TotalPoints int    `json:"total_points"`
}

func GetDashboard(db *sql.DB, groupID int) ([]Dashboard, error) {
	rows, err := db.Query("SELECT * FROM dashboard WHERE group_id = $1", groupID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	dashboard := []Dashboard{}
	for rows.Next() {
		var d Dashboard
		if err := rows.Scan(&d.GroupID, &d.UserID, &d.FirstName, &d.LastName, &d.TotalPoints); err != nil {
			return nil, err
		}
		dashboard = append(dashboard, d)
	}

	return dashboard, nil
}
