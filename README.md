# futisveikkaus

Project was put together fairly quickly and completely for my own purposes: I wanted to modernize and mostly automate our traditional betting competition which we have held for all football competitions in the past years. In the competition, users try to guess correct match result for each match in the competition, which is for example a World Cup tournament. Previously all of this was done with some spreadsheets printed on paper which typically resulted to a lot of hassle. As the goal was to create the app quickly and without too much effort:

- UI is made with Svelte and Typescript.
- Supabase was chosen for backend as its free tier meets our demands, has fairly good documentation, is set up very quickly and also provides PostgREST (RESTful API).
- As Supabase contains PostgreSQL in it, so we can easily automate most of the logic in the application with SQL functions and triggers.

## Main features

- Admin panel to help to organize the tournament
- Authentication
- Users can register and predict the game results
- Scoreboard with live results (For teams & users)
- Basic team statistics

## Usage

- Clone the repository
- Setup Supabase project
- Run SQL scripts in the Supabase's PostgreSQL CLI, `/sql/tables.sql` -> `/sql/functions.sql` -> `/sql/triggers.sql`
- Fill in the `/app/.env` with the needed fields in `/app/.env.example`
- Host the app somewhere
- Link it to your friends

## LICENSE

MIT License

Copyright (c) 2024 [ttopias](https://github.com/ttopias)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
