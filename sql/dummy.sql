-- Insert dummy data into the teams table
INSERT INTO teams (country_code, name, "group", win, draw, loss, gf, gaa)
VALUES 
('BRA', 'Brazil', 'A', 2, 1, 0, 5, 2),
('ARG', 'Argentina', 'A', 2, 0, 1, 4, 2),
('FRA', 'France', 'B', 3, 0, 0, 7, 1),
('GER', 'Germany', 'B', 1, 1, 1, 3, 3),
('ENG', 'England', 'B', 2, 0, 1, 6, 3);

-- Insert dummy data into the groups table
INSERT INTO groups (name)
VALUES ('Group 1');

-- Insert dummy data into the users table (3 users, including one admin)
INSERT INTO users (group_id, email, password, first_name, last_name, points, email_verified, role)
VALUES 
(1, 'admin@example.com', 'adminpassword', 'Admin', 'User', 50, TRUE, 'admin'),
(1, 'user1@example.com', 'user1password', 'User', 'One', 30, TRUE, 'user'),
(1, 'user2@example.com', 'user2password', 'User', 'Two', 20, TRUE, 'user');

-- Insert dummy data into the matches table (some matches already played)
INSERT INTO matches (date, time, stage, home_id, away_id, home_goals, away_goals, finished)
VALUES 
('2024-08-20', '18:00', 'group', 1, 2, 2, 1, TRUE),
('2024-08-21', '20:00', 'group', 3, 4, 3, 1, TRUE),
('2024-08-22', '17:00', 'group', 5, 1, NULL, NULL, FALSE),
('2024-08-23', '19:00', 'group', 2, 3, NULL, NULL, FALSE);

-- Insert dummy data into the guesses table (users making guesses)
INSERT INTO guesses (match_id, user_id, home_goals, away_goals, points, points_calculated)
VALUES 
(1, 2, 2, 1, 10, TRUE),
(2, 2, 3, 1, 10, TRUE),
(1, 3, 1, 2, 0, TRUE),
(3, 3, 2, 1, 0, FALSE),
(4, 2, 1, 1, 0, FALSE),
(4, 3, 0, 2, 0, FALSE);

-- Update the teams table to reflect the results of the played matches
UPDATE teams SET win = win + 1, gf = gf + 2, gaa = gaa + 1 WHERE team_id = 1;
UPDATE teams SET loss = loss + 1, gf = gf + 1, gaa = gaa + 2 WHERE team_id = 2;
UPDATE teams SET win = win + 1, gf = gf + 3, gaa = gaa + 1 WHERE team_id = 3;
UPDATE teams SET loss = loss + 1, gf = gf + 1, gaa = gaa + 3 WHERE team_id = 4;

-- Final step: update the last_login time to make the data more realistic
UPDATE users SET last_login = '2024-08-22 12:00:00' WHERE user_id = 1;
UPDATE users SET last_login = '2024-08-22 12:30:00' WHERE user_id = 2;
UPDATE users SET last_login = '2024-08-22 13:00:00' WHERE user_id = 3;
