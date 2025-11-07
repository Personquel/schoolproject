const express = require('express');
const { Pool } = require('pg');
const bodyParser = require('body-parser');
const path = require('path');
const bcrypt = require('bcrypt');
const session = require('express-session');
const multer = require('multer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Set EJS as template engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage, fileFilter: (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files allowed'));
  }
}});
app.use(session({
  secret: 'survey-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }
}));

// PostgreSQL connection
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// Initialize database tables
async function initDatabase() {
  try {
    // Users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        profile_picture VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Student questions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS student_questions (
        id SERIAL PRIMARY KEY,
        question_text TEXT NOT NULL,
        option_a VARCHAR(255) NOT NULL,
        option_b VARCHAR(255) NOT NULL,
        option_c VARCHAR(255) NOT NULL,
        option_d VARCHAR(255) NOT NULL,
        category VARCHAR(255) NOT NULL
      )
    `);

    // Student responses table (legacy - individual responses)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS student_responses (
        id SERIAL PRIMARY KEY,
        question_id INTEGER REFERENCES student_questions(id),
        selected_option CHAR(1) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Drop and recreate student_survey_responses table with correct structure
    await pool.query('DROP TABLE IF EXISTS student_survey_responses');
    await pool.query(`
      CREATE TABLE student_survey_responses (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) NOT NULL,
        answers TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Teacher questions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS teacher_questions (
        id SERIAL PRIMARY KEY,
        question_text TEXT NOT NULL,
        option_a VARCHAR(255) NOT NULL,
        option_b VARCHAR(255) NOT NULL,
        option_c VARCHAR(255) NOT NULL,
        option_d VARCHAR(255) NOT NULL,
        category VARCHAR(255) NOT NULL
      )
    `);

    // Teacher survey responses table (username as primary key, answers in single column)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS teacher_survey_responses (
        username VARCHAR(255) PRIMARY KEY,
        answers TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Extra activities questions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS extra_questions (
        id SERIAL PRIMARY KEY,
        question_text TEXT NOT NULL,
        option_a VARCHAR(255) NOT NULL,
        option_b VARCHAR(255) NOT NULL,
        option_c VARCHAR(255) NOT NULL,
        option_d VARCHAR(255) NOT NULL,
        category VARCHAR(255) NOT NULL
      )
    `);

    // Extra activities survey responses table (username as primary key, answers in single column)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS extra_survey_responses (
        username VARCHAR(255) PRIMARY KEY,
        answers TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Website survey responses table (username as primary key, answers in single column)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS website_survey_responses (
        username VARCHAR(255) PRIMARY KEY,
        answers TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // User survey responses table (username as primary key, answers in single column)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_survey_responses (
        username VARCHAR(255) PRIMARY KEY,
        answers TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Food questions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS food_questions (
        id SERIAL PRIMARY KEY,
        question_text TEXT NOT NULL,
        option_a VARCHAR(255) NOT NULL,
        option_b VARCHAR(255) NOT NULL,
        option_c VARCHAR(255) NOT NULL,
        option_d VARCHAR(255) NOT NULL,
        category VARCHAR(255) NOT NULL
      )
    `);

    // Food survey responses table (username as primary key, answers in single column)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS food_survey_responses (
        username VARCHAR(255) PRIMARY KEY,
        answers TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Movie questions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS movie_questions (
        id SERIAL PRIMARY KEY,
        question_text TEXT NOT NULL,
        option_a VARCHAR(255) NOT NULL,
        option_b VARCHAR(255) NOT NULL,
        option_c VARCHAR(255) NOT NULL,
        option_d VARCHAR(255) NOT NULL,
        category VARCHAR(255) NOT NULL
      )
    `);

    // Movie survey responses table (username as primary key, answers in single column)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS movie_survey_responses (
        username VARCHAR(255) PRIMARY KEY,
        answers TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Programming questions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS programming_questions (
        id SERIAL PRIMARY KEY,
        question_text TEXT NOT NULL,
        option_a VARCHAR(255) NOT NULL,
        option_b VARCHAR(255) NOT NULL,
        option_c VARCHAR(255) NOT NULL,
        option_d VARCHAR(255) NOT NULL,
        category VARCHAR(255) NOT NULL
      )
    `);

    // Programming survey responses table (username as primary key, answers in single column)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS programming_survey_responses (
        username VARCHAR(255) PRIMARY KEY,
        answers TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Sport questions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sport_questions (
        id SERIAL PRIMARY KEY,
        question_text TEXT NOT NULL,
        option_a VARCHAR(255) NOT NULL,
        option_b VARCHAR(255) NOT NULL,
        option_c VARCHAR(255) NOT NULL,
        option_d VARCHAR(255) NOT NULL,
        category VARCHAR(255) NOT NULL
      )
    `);

    // Sport survey responses table (username as primary key, answers in single column)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sport_survey_responses (
        username VARCHAR(255) PRIMARY KEY,
        answers TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Team questions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS team_questions (
        id SERIAL PRIMARY KEY,
        question_text TEXT NOT NULL,
        option_a VARCHAR(255) NOT NULL,
        option_b VARCHAR(255) NOT NULL,
        option_c VARCHAR(255) NOT NULL,
        option_d VARCHAR(255) NOT NULL,
        category VARCHAR(255) NOT NULL
      )
    `);

    // Team survey responses table (username as primary key, answers in single column)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS team_survey_responses (
        username VARCHAR(255) PRIMARY KEY,
        answers TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // User questions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_questions (
        id SERIAL PRIMARY KEY,
        question_text TEXT NOT NULL
      )
    `);



    // Avatars table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS avatars (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        url VARCHAR(255) NOT NULL
      )
    `);

    // Insert default avatars
    const avatarCount = await pool.query('SELECT COUNT(*) FROM avatars');
    if (parseInt(avatarCount.rows[0].count) === 0) {
      const avatars = [
        { name: 'Student', url: 'https://via.placeholder.com/100x100/667eea/ffffff?text=👨‍🎓' },
        { name: 'Teacher', url: 'https://via.placeholder.com/100x100/e74c3c/ffffff?text=👩‍🏫' },
        { name: 'Scientist', url: 'https://via.placeholder.com/100x100/2ecc71/ffffff?text=👨‍🔬' },
        { name: 'Artist', url: 'https://via.placeholder.com/100x100/f39c12/ffffff?text=👩‍🎨' },
        { name: 'Engineer', url: 'https://via.placeholder.com/100x100/9b59b6/ffffff?text=👨‍💻' },
        { name: 'Doctor', url: 'https://via.placeholder.com/100x100/1abc9c/ffffff?text=👩‍⚕️' }
      ];
      for (const avatar of avatars) {
        await pool.query('INSERT INTO avatars (name, url) VALUES ($1, $2)', [avatar.name, avatar.url]);
      }
    }

    // Insert sample users
    const userCount = await pool.query('SELECT COUNT(*) FROM users');
    if (parseInt(userCount.rows[0].count) === 0) {
      const hashedAdminPassword = await bcrypt.hash('Password123', 10);
      const hashedUserPassword = await bcrypt.hash('UserPass123', 10);
      await pool.query('INSERT INTO users (username, password) VALUES ($1, $2)', ['admin', hashedAdminPassword]);
      await pool.query('INSERT INTO users (username, password) VALUES ($1, $2)', ['user', hashedUserPassword]);
    }

    const fs = require('fs');
    const path = require('path');

    // Load student questions from CSV data
    const studentCount = await pool.query('SELECT COUNT(*) FROM student_questions');
    if (parseInt(studentCount.rows[0].count) === 0) {
      const csvPath = path.join(__dirname, 'student.csv');
      if (fs.existsSync(csvPath)) {
        const csvData = fs.readFileSync(csvPath, 'utf8');
        const lines = csvData.split('\n').slice(1);
        for (const line of lines) {
          if (line.trim()) {
            const [question, optionA, optionB, optionC, optionD, category] = line.split(',').map(item => item.trim().replace(/\r$/, ''));
            await pool.query(
              'INSERT INTO student_questions (question_text, option_a, option_b, option_c, option_d, category) VALUES ($1, $2, $3, $4, $5, $6)',
              [question, optionA, optionB, optionC, optionD, category]
            );
          }
        }
      }
    }

    // Load teacher questions from CSV data
    const teacherCount = await pool.query('SELECT COUNT(*) FROM teacher_questions');
    if (parseInt(teacherCount.rows[0].count) === 0) {
      const csvPath = path.join(__dirname, 'Teacher.csv');
      if (fs.existsSync(csvPath)) {
        const csvData = fs.readFileSync(csvPath, 'utf8');
        const lines = csvData.split('\n').slice(1);
        for (const line of lines) {
          if (line.trim()) {
            const [question, optionA, optionB, optionC, optionD, category] = line.split(',').map(item => item.trim().replace(/\r$/, ''));
            await pool.query(
              'INSERT INTO teacher_questions (question_text, option_a, option_b, option_c, option_d, category) VALUES ($1, $2, $3, $4, $5, $6)',
              [question, optionA, optionB, optionC, optionD, category]
            );
          }
        }
      }
    }

    // Load extra activities questions from CSV data
    const extraCount = await pool.query('SELECT COUNT(*) FROM extra_questions');
    if (parseInt(extraCount.rows[0].count) === 0) {
      const csvPath = path.join(__dirname, 'extraactivites.csv');
      if (fs.existsSync(csvPath)) {
        const csvData = fs.readFileSync(csvPath, 'utf8');
        const lines = csvData.split('\n').slice(1);
        for (const line of lines) {
          if (line.trim()) {
            const [question, optionA, optionB, optionC, optionD, category] = line.split(',').map(item => item.trim().replace(/\r$/, ''));
            await pool.query(
              'INSERT INTO extra_questions (question_text, option_a, option_b, option_c, option_d, category) VALUES ($1, $2, $3, $4, $5, $6)',
              [question, optionA, optionB, optionC, optionD, category]
            );
          }
        }
      }
    }

    // Load food questions from CSV data
    const foodCount = await pool.query('SELECT COUNT(*) FROM food_questions');
    if (parseInt(foodCount.rows[0].count) === 0) {
      const csvPath = path.join(__dirname, 'food.csv');
      if (fs.existsSync(csvPath)) {
        const csvData = fs.readFileSync(csvPath, 'utf8');
        const lines = csvData.split('\n').slice(1);
        for (const line of lines) {
          if (line.trim()) {
            const [question, optionA, optionB, optionC, optionD, category] = line.split(',').map(item => item.trim().replace(/\r$/, ''));
            await pool.query(
              'INSERT INTO food_questions (question_text, option_a, option_b, option_c, option_d, category) VALUES ($1, $2, $3, $4, $5, $6)',
              [question, optionA, optionB, optionC, optionD, category]
            );
          }
        }
      }
    }

    // Load movie questions from CSV data
    const movieCount = await pool.query('SELECT COUNT(*) FROM movie_questions');
    if (parseInt(movieCount.rows[0].count) === 0) {
      const csvPath = path.join(__dirname, 'movie.csv');
      if (fs.existsSync(csvPath)) {
        const csvData = fs.readFileSync(csvPath, 'utf8');
        const lines = csvData.split('\n').slice(1);
        for (const line of lines) {
          if (line.trim()) {
            const [question, optionA, optionB, optionC, optionD, category] = line.split(',').map(item => item.trim().replace(/\r$/, ''));
            await pool.query(
              'INSERT INTO movie_questions (question_text, option_a, option_b, option_c, option_d, category) VALUES ($1, $2, $3, $4, $5, $6)',
              [question, optionA, optionB, optionC, optionD, category]
            );
          }
        }
      }
    }

    // Load programming questions from CSV data
    const programmingCount = await pool.query('SELECT COUNT(*) FROM programming_questions');
    if (parseInt(programmingCount.rows[0].count) === 0) {
      const csvPath = path.join(__dirname, 'programming.csv');
      if (fs.existsSync(csvPath)) {
        const csvData = fs.readFileSync(csvPath, 'utf8');
        const lines = csvData.split('\n').slice(1);
        for (const line of lines) {
          if (line.trim()) {
            const [question, optionA, optionB, optionC, optionD, category] = line.split(',').map(item => item.trim().replace(/\r$/, ''));
            await pool.query(
              'INSERT INTO programming_questions (question_text, option_a, option_b, option_c, option_d, category) VALUES ($1, $2, $3, $4, $5, $6)',
              [question, optionA, optionB, optionC, optionD, category]
            );
          }
        }
      }
    }

    // Load sport questions from CSV data
    const sportCount = await pool.query('SELECT COUNT(*) FROM sport_questions');
    if (parseInt(sportCount.rows[0].count) === 0) {
      const csvPath = path.join(__dirname, 'sport.csv');
      if (fs.existsSync(csvPath)) {
        const csvData = fs.readFileSync(csvPath, 'utf8');
        const lines = csvData.split('\n').slice(1);
        for (const line of lines) {
          if (line.trim()) {
            const [question, optionA, optionB, optionC, optionD, category] = line.split(',').map(item => item.trim().replace(/\r$/, ''));
            await pool.query(
              'INSERT INTO sport_questions (question_text, option_a, option_b, option_c, option_d, category) VALUES ($1, $2, $3, $4, $5, $6)',
              [question, optionA, optionB, optionC, optionD, category]
            );
          }
        }
      }
    }

    // Load team questions from CSV data
    const teamCount = await pool.query('SELECT COUNT(*) FROM team_questions');
    if (parseInt(teamCount.rows[0].count) === 0) {
      const csvPath = path.join(__dirname, 'team.csv');
      if (fs.existsSync(csvPath)) {
        const csvData = fs.readFileSync(csvPath, 'utf8');
        const lines = csvData.split('\n').slice(1);
        for (const line of lines) {
          if (line.trim()) {
            const [question, optionA, optionB, optionC, optionD, category] = line.split(',').map(item => item.trim().replace(/\r$/, ''));
            await pool.query(
              'INSERT INTO team_questions (question_text, option_a, option_b, option_c, option_d, category) VALUES ($1, $2, $3, $4, $5, $6)',
              [question, optionA, optionB, optionC, optionD, category]
            );
          }
        }
      }
    }

    // Load user questions from CSV data
    const userCount = await pool.query('SELECT COUNT(*) FROM user_questions');
    if (parseInt(userCount.rows[0].count) === 0) {
      const csvPath = path.join(__dirname, 'user.csv');
      if (fs.existsSync(csvPath)) {
        const csvData = fs.readFileSync(csvPath, 'utf8');
        const lines = csvData.split('\n').slice(1);
        for (const line of lines) {
          if (line.trim()) {
            const parts = line.split(',');
            const question = parts.slice(1).join(',').trim().replace(/\r$/, '');
            await pool.query(
              'INSERT INTO user_questions (question_text) VALUES ($1)',
              [question]
            );
          }
        }
      }
    }

    console.log('Database initialized successfully');
  } catch (err) {
    console.error('Database initialization error:', err);
  }
}

// Create uploads directory
const fs = require('fs');
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// Initialize database on startup
initDatabase();

// Authentication middleware
function requireAuth(req, res, next) {
  if (req.session.user) {
    next();
  } else {
    res.redirect('/');
  }
}

// Routes
app.get('/', (req, res) => {
  res.render('login');
});

app.get('/welcome', requireAuth, (req, res) => {
  res.render('welcome', { user: req.session.user || null });
});

app.get('/website-survey', requireAuth, (req, res) => {
  res.render('website-survey');
});

app.get('/summary', requireAuth, (req, res) => {
  res.render('summary');
});

app.get('/about', requireAuth, (req, res) => {
  res.render('about');
});

app.get('/contact', requireAuth, (req, res) => {
  res.render('contact');
});

app.get('/survey01', requireAuth, (req, res) => {
  res.render('survey01');
});

app.get('/index', requireAuth, (req, res) => {
  res.render('index');
});

app.get('/student-survey', requireAuth, (req, res) => {
  res.render('student-survey', { user: req.session.user });
});

app.get('/teacher-survey', requireAuth, (req, res) => {
  res.render('teacher-survey', { user: req.session.user });
});

app.get('/extra-survey', requireAuth, (req, res) => {
  res.render('extra-survey', { user: req.session.user });
});

app.get('/food-survey', requireAuth, (req, res) => {
  res.render('food-survey', { user: req.session.user });
});

app.get('/movie-survey', requireAuth, (req, res) => {
  res.render('movie-survey', { user: req.session.user });
});

app.get('/programming-survey', requireAuth, (req, res) => {
  res.render('programming-survey', { user: req.session.user });
});

app.get('/sport-survey', requireAuth, (req, res) => {
  res.render('sport-survey', { user: req.session.user });
});

app.get('/team-survey', requireAuth, (req, res) => {
  res.render('team-survey', { user: req.session.user });
});

app.get('/api/test-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW() as current_time');
    res.json({ status: 'Connected', time: result.rows[0].current_time });
  } catch (err) {
    res.status(500).json({ status: 'Failed', error: err.message });
  }
});

app.get('/api/student-questions', async (req, res) => {
  try {
    const categories = await pool.query('SELECT DISTINCT category FROM student_questions');
    const allQuestions = [];
    for (const cat of categories.rows) {
      const questions = await pool.query('SELECT * FROM student_questions WHERE category = $1 ORDER BY RANDOM() LIMIT 3', [cat.category]);
      allQuestions.push(...questions.rows);
    }
    res.json(allQuestions.sort(() => Math.random() - 0.5).slice(0, 10));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/categories', async (req, res) => {
  try {
    const result = await pool.query('SELECT DISTINCT category FROM student_questions');
    res.json(result.rows.map(row => row.category));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/teacher-questions', async (req, res) => {
  try {
    const categories = await pool.query('SELECT DISTINCT category FROM teacher_questions');
    const allQuestions = [];
    for (const cat of categories.rows) {
      const questions = await pool.query('SELECT * FROM teacher_questions WHERE category = $1 ORDER BY RANDOM() LIMIT 3', [cat.category]);
      allQuestions.push(...questions.rows);
    }
    res.json(allQuestions.sort(() => Math.random() - 0.5).slice(0, 10));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/teacher-categories', async (req, res) => {
  try {
    const result = await pool.query('SELECT DISTINCT category FROM teacher_questions');
    res.json(result.rows.map(row => row.category));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



app.get('/api/extra-questions', async (req, res) => {
  try {
    const categories = await pool.query('SELECT DISTINCT category FROM extra_questions');
    const allQuestions = [];
    for (const cat of categories.rows) {
      const questions = await pool.query('SELECT * FROM extra_questions WHERE category = $1 ORDER BY RANDOM() LIMIT 3', [cat.category]);
      allQuestions.push(...questions.rows);
    }
    res.json(allQuestions.sort(() => Math.random() - 0.5).slice(0, 10));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/extra-categories', async (req, res) => {
  try {
    const result = await pool.query('SELECT DISTINCT category FROM extra_questions');
    res.json(result.rows.map(row => row.category));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/food-questions', async (req, res) => {
  try {
    const categories = await pool.query('SELECT DISTINCT category FROM food_questions');
    const allQuestions = [];
    for (const cat of categories.rows) {
      const questions = await pool.query('SELECT * FROM food_questions WHERE category = $1 ORDER BY RANDOM() LIMIT 3', [cat.category]);
      allQuestions.push(...questions.rows);
    }
    res.json(allQuestions.sort(() => Math.random() - 0.5).slice(0, 10));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/food-categories', async (req, res) => {
  try {
    const result = await pool.query('SELECT DISTINCT category FROM food_questions');
    res.json(result.rows.map(row => row.category));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/movie-questions', async (req, res) => {
  try {
    const categories = await pool.query('SELECT DISTINCT category FROM movie_questions');
    const allQuestions = [];
    for (const cat of categories.rows) {
      const questions = await pool.query('SELECT * FROM movie_questions WHERE category = $1 ORDER BY RANDOM() LIMIT 3', [cat.category]);
      allQuestions.push(...questions.rows);
    }
    res.json(allQuestions.sort(() => Math.random() - 0.5).slice(0, 10));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/movie-categories', async (req, res) => {
  try {
    const result = await pool.query('SELECT DISTINCT category FROM movie_questions');
    res.json(result.rows.map(row => row.category));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/programming-questions', async (req, res) => {
  try {
    const categories = await pool.query('SELECT DISTINCT category FROM programming_questions');
    const allQuestions = [];
    for (const cat of categories.rows) {
      const questions = await pool.query('SELECT * FROM programming_questions WHERE category = $1 ORDER BY RANDOM() LIMIT 3', [cat.category]);
      allQuestions.push(...questions.rows);
    }
    res.json(allQuestions.sort(() => Math.random() - 0.5).slice(0, 10));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/programming-categories', async (req, res) => {
  try {
    const result = await pool.query('SELECT DISTINCT category FROM programming_questions');
    res.json(result.rows.map(row => row.category));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/sport-questions', async (req, res) => {
  try {
    const categories = await pool.query('SELECT DISTINCT category FROM sport_questions');
    const allQuestions = [];
    for (const cat of categories.rows) {
      const questions = await pool.query('SELECT * FROM sport_questions WHERE category = $1 ORDER BY RANDOM() LIMIT 3', [cat.category]);
      allQuestions.push(...questions.rows);
    }
    res.json(allQuestions.sort(() => Math.random() - 0.5).slice(0, 10));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/sport-categories', async (req, res) => {
  try {
    const result = await pool.query('SELECT DISTINCT category FROM sport_questions');
    res.json(result.rows.map(row => row.category));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/team-questions', async (req, res) => {
  try {
    const categories = await pool.query('SELECT DISTINCT category FROM team_questions');
    const allQuestions = [];
    for (const cat of categories.rows) {
      const questions = await pool.query('SELECT * FROM team_questions WHERE category = $1 ORDER BY RANDOM() LIMIT 3', [cat.category]);
      allQuestions.push(...questions.rows);
    }
    res.json(allQuestions.sort(() => Math.random() - 0.5).slice(0, 10));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/team-categories', async (req, res) => {
  try {
    const result = await pool.query('SELECT DISTINCT category FROM team_questions');
    res.json(result.rows.map(row => row.category));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  try {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    
    if (result.rows.length > 0) {
      const user = result.rows[0];
      const isValidPassword = await bcrypt.compare(password, user.password);
      
      if (isValidPassword) {
        req.session.user = { id: user.id, username: user.username, profile_picture: user.profile_picture };
        res.json({ message: 'Login successful', user: { id: user.id, username: user.username, profile_picture: user.profile_picture } });
      } else {
        res.status(401).json({ error: 'Invalid username or password' });
      }
    } else {
      res.status(401).json({ error: 'Invalid username or password' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters long' });
  }

  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password)) {
    return res.status(400).json({ error: 'Password must contain both uppercase and lowercase letters' });
  }

  try {
    // Check if user already exists
    const existingUser = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'Username already exists' });
    }

    // Hash password and create new user
    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query('INSERT INTO users (username, password) VALUES ($1, $2)', [username, hashedPassword]);
    res.json({ message: 'User registered successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/student-responses', async (req, res) => {
  const { username, answers } = req.body;
  
  if (!username || !answers || answers.length !== 10) {
    return res.status(400).json({ error: 'Must provide username and exactly 10 answers' });
  }

  try {
    await pool.query(
      'INSERT INTO student_survey_responses (username, answers) VALUES ($1, $2)',
      [username, JSON.stringify(answers)]
    );
    res.json({ message: 'Student responses saved successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/teacher-survey-responses', async (req, res) => {
  const { username, answers } = req.body;
  
  if (!username || !answers || answers.length !== 10) {
    return res.status(400).json({ error: 'Must provide username and exactly 10 answers' });
  }

  try {
    await pool.query(
      'INSERT INTO teacher_survey_responses (username, answers) VALUES ($1, $2) ON CONFLICT (username) DO UPDATE SET answers = $2, created_at = CURRENT_TIMESTAMP',
      [username, JSON.stringify(answers)]
    );
    res.json({ message: 'Teacher survey responses saved successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/extra-survey-responses', async (req, res) => {
  const { username, answers } = req.body;
  
  if (!username || !answers || answers.length !== 10) {
    return res.status(400).json({ error: 'Must provide username and exactly 10 answers' });
  }

  try {
    await pool.query(
      'INSERT INTO extra_survey_responses (username, answers) VALUES ($1, $2) ON CONFLICT (username) DO UPDATE SET answers = $2, created_at = CURRENT_TIMESTAMP',
      [username, JSON.stringify(answers)]
    );
    res.json({ message: 'Extra activities survey responses saved successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/food-survey-responses', async (req, res) => {
  const { username, answers } = req.body;
  
  if (!username || !answers || answers.length !== 10) {
    return res.status(400).json({ error: 'Must provide username and exactly 10 answers' });
  }

  try {
    await pool.query(
      'INSERT INTO food_survey_responses (username, answers) VALUES ($1, $2) ON CONFLICT (username) DO UPDATE SET answers = $2, created_at = CURRENT_TIMESTAMP',
      [username, JSON.stringify(answers)]
    );
    res.json({ message: 'Food survey responses saved successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/movie-survey-responses', async (req, res) => {
  const { username, answers } = req.body;
  
  if (!username || !answers || answers.length !== 10) {
    return res.status(400).json({ error: 'Must provide username and exactly 10 answers' });
  }

  try {
    await pool.query(
      'INSERT INTO movie_survey_responses (username, answers) VALUES ($1, $2) ON CONFLICT (username) DO UPDATE SET answers = $2, created_at = CURRENT_TIMESTAMP',
      [username, JSON.stringify(answers)]
    );
    res.json({ message: 'Movie survey responses saved successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/programming-survey-responses', async (req, res) => {
  const { username, answers } = req.body;
  
  if (!username || !answers || answers.length !== 10) {
    return res.status(400).json({ error: 'Must provide username and exactly 10 answers' });
  }

  try {
    await pool.query(
      'INSERT INTO programming_survey_responses (username, answers) VALUES ($1, $2) ON CONFLICT (username) DO UPDATE SET answers = $2, created_at = CURRENT_TIMESTAMP',
      [username, JSON.stringify(answers)]
    );
    res.json({ message: 'Programming survey responses saved successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/sport-survey-responses', async (req, res) => {
  const { username, answers } = req.body;
  
  if (!username || !answers || answers.length !== 10) {
    return res.status(400).json({ error: 'Must provide username and exactly 10 answers' });
  }

  try {
    await pool.query(
      'INSERT INTO sport_survey_responses (username, answers) VALUES ($1, $2) ON CONFLICT (username) DO UPDATE SET answers = $2, created_at = CURRENT_TIMESTAMP',
      [username, JSON.stringify(answers)]
    );
    res.json({ message: 'Sport survey responses saved successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/team-survey-responses', async (req, res) => {
  const { username, answers } = req.body;
  
  if (!username || !answers || answers.length !== 10) {
    return res.status(400).json({ error: 'Must provide username and exactly 10 answers' });
  }

  try {
    await pool.query(
      'INSERT INTO team_survey_responses (username, answers) VALUES ($1, $2) ON CONFLICT (username) DO UPDATE SET answers = $2, created_at = CURRENT_TIMESTAMP',
      [username, JSON.stringify(answers)]
    );
    res.json({ message: 'Team survey responses saved successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/website-survey-responses', async (req, res) => {
  const { username, answers } = req.body;
  
  if (!username || !answers || answers.length !== 10) {
    return res.status(400).json({ error: 'Must provide username and exactly 10 answers' });
  }

  try {
    await pool.query(
      'INSERT INTO website_survey_responses (username, answers) VALUES ($1, $2) ON CONFLICT (username) DO UPDATE SET answers = $2, created_at = CURRENT_TIMESTAMP',
      [username, JSON.stringify(answers)]
    );
    res.json({ message: 'Website survey responses saved successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/user-survey-questions', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM user_questions ORDER BY id');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/user-survey-responses', async (req, res) => {
  const { username, answers } = req.body;
  
  if (!username || !answers || answers.length !== 10) {
    return res.status(400).json({ error: 'Must provide username and exactly 10 answers' });
  }

  try {
    await pool.query(
      'INSERT INTO user_survey_responses (username, answers) VALUES ($1, $2) ON CONFLICT (username) DO UPDATE SET answers = $2, created_at = CURRENT_TIMESTAMP',
      [username, JSON.stringify(answers)]
    );
    res.json({ message: 'User survey responses saved successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/user-survey-page', requireAuth, (req, res) => {
  res.render('user-survey-page', { user: req.session.user || null });
});

app.get('/start-journey', requireAuth, (req, res) => {
  res.redirect('/user-survey-page');
});

app.post('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ message: 'Logged out successfully' });
});

app.get('/api/avatars', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM avatars');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/upload-profile-picture', upload.single('profilePicture'), async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Not logged in' });
  }
  
  try {
    const filename = req.file.filename;
    await pool.query('UPDATE users SET profile_picture = $1 WHERE id = $2', [filename, req.session.user.id]);
    req.session.user.profile_picture = filename;
    res.json({ message: 'Profile picture updated', filename });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/set-avatar', async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Not logged in' });
  }
  
  try {
    const { avatarUrl } = req.body;
    await pool.query('UPDATE users SET profile_picture = $1 WHERE id = $2', [avatarUrl, req.session.user.id]);
    req.session.user.profile_picture = avatarUrl;
    res.json({ message: 'Avatar updated', avatarUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/responses', async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Not logged in' });
  }
  
  try {
    const { responses } = req.body;
    const username = req.session.user.username;
    
    // Create survey01_responses table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS survey01_responses (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) NOT NULL,
        responses TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await pool.query(
      'INSERT INTO survey01_responses (username, responses) VALUES ($1, $2)',
      [username, JSON.stringify(responses)]
    );
    
    res.json({ message: 'Survey responses saved successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});