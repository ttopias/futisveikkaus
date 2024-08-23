package models

import (
	"database/sql"
	"testing"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/stretchr/testify/assert"
)

func TestGetDashboard(t *testing.T) {
	// Create a mock database connection and mock
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	// Define the expected rows for the mock query
	rows := sqlmock.NewRows([]string{"group_id", "user_id", "first_name", "last_name", "total_points"}).
		AddRow(1, 101, "John", "Doe", 120).
		AddRow(1, 102, "Jane", "Doe", 110)

	// Expect the query with the correct SQL and argument
	mock.ExpectQuery("^SELECT \\* FROM dashboard WHERE group_id = \\$1$").
		WithArgs(1).
		WillReturnRows(rows)

	// Call the GetDashboard function
	dashboard, err := GetDashboard(db, 1)

	// Check if no error occurred
	assert.NoError(t, err)
	// Validate the returned data
	assert.Len(t, dashboard, 2)
	assert.Equal(t, dashboard[0].UserID, 101)
	assert.Equal(t, dashboard[0].FirstName, "John")
	assert.Equal(t, dashboard[0].LastName, "Doe")
	assert.Equal(t, dashboard[0].TotalPoints, 120)

	assert.Equal(t, dashboard[1].UserID, 102)
	assert.Equal(t, dashboard[1].FirstName, "Jane")
	assert.Equal(t, dashboard[1].LastName, "Doe")
	assert.Equal(t, dashboard[1].TotalPoints, 110)

	// Ensure all expectations are met
	err = mock.ExpectationsWereMet()
	assert.NoError(t, err)
}

func TestGetDashboardWithError(t *testing.T) {
	// Create a mock database connection and mock
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	// Expect an error when querying the database
	mock.ExpectQuery("^SELECT \\* FROM dashboard WHERE group_id = \\$1$").
		WithArgs(1).
		WillReturnError(sql.ErrNoRows)

	// Call the GetDashboard function
	dashboard, err := GetDashboard(db, 1)

	// Check if the error is handled
	assert.Error(t, err)
	assert.Nil(t, dashboard)

	// Ensure all expectations are met
	err = mock.ExpectationsWereMet()
	assert.NoError(t, err)
}
