const express = require('express');
const { Pool } = require('pg');
const bodyParser = require('body-parser');
const path = require('path');
const bcrypt = require('bcrypt');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Set EJS as template engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(bodyParser.json());
app.use(express.static('public'));

// PostgreSQL connection
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'survey_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
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

    // Student responses table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS student_responses (
        id SERIAL PRIMARY KEY,
        question_id INTEGER REFERENCES student_questions(id),
        selected_option CHAR(1) NOT NULL,
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

    // Teacher responses table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS teacher_responses (
        id SERIAL PRIMARY KEY,
        question_id INTEGER REFERENCES teacher_questions(id),
        selected_option CHAR(1) NOT NULL,
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

    // Extra activities responses table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS extra_responses (
        id SERIAL PRIMARY KEY,
        question_id INTEGER REFERENCES extra_questions(id),
        selected_option CHAR(1) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // General survey responses table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS general_responses (
        id SERIAL PRIMARY KEY,
        question_id INTEGER NOT NULL,
        answer VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

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

    console.log('Database initialized successfully');
  } catch (err) {
    console.error('Database initialization error:', err);
  }
}

// Initialize database on startup
initDatabase();

// Routes
app.get('/', (req, res) => {
  res.render('login');
});

app.get('/welcome', (req, res) => {
  res.render('welcome');
});


app.get('/survey01', (req, res) => {
  res.render('survey01');
});

app.get('/summary', (req, res) => {
  res.render('summary');
});

app.get('/about', (req, res) => {
  res.render('about');
});

app.get('/contact', (req, res) => {
  res.render('contact');
});

app.get('/index', (req, res) => {
  res.render('index');
});

app.get('/student-survey', (req, res) => {
  res.render('student-survey');
});

app.get('/teacher-survey', (req, res) => {
  res.render('teacher-survey');
});

app.get('/extra-survey', (req, res) => {
  res.render('extra-survey');
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
    const category = req.query.category;
    let query = 'SELECT * FROM student_questions';
    let params = [];
    
    if (category) {
      query += ' WHERE category = $1';
      params.push(category);
    }
    
    query += ' ORDER BY RANDOM() LIMIT 10';
    const result = await pool.query(query, params);
    res.json(result.rows);
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
    const category = req.query.category;
    let query = 'SELECT * FROM teacher_questions';
    let params = [];
    
    if (category) {
      query += ' WHERE category = $1';
      params.push(category);
    }
    
    query += ' ORDER BY RANDOM() LIMIT 10';
    const result = await pool.query(query, params);
    res.json(result.rows);
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

app.post('/api/student-responses', async (req, res) => {
  try {
    const { responses } = req.body;
    for (const response of responses) {
      await pool.query(
        'INSERT INTO student_responses (question_id, selected_option) VALUES ($1, $2)',
        [response.question_id, response.selected_option]
      );
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/teacher-responses', async (req, res) => {
  try {
    const { responses } = req.body;
    for (const response of responses) {
      await pool.query(
        'INSERT INTO teacher_responses (question_id, selected_option) VALUES ($1, $2)',
        [response.question_id, response.selected_option]
      );
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/extra-questions', async (req, res) => {
  try {
    const category = req.query.category;
    let query = 'SELECT * FROM extra_questions';
    let params = [];
    
    if (category) {
      query += ' WHERE category = $1';
      params.push(category);
    }
    
    query += ' ORDER BY RANDOM() LIMIT 10';
    const result = await pool.query(query, params);
    res.json(result.rows);
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
        res.json({ message: 'Login successful', user: { id: user.id, username: user.username } });
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
  const { responses } = req.body;
  
  if (!responses || !Array.isArray(responses)) {
    return res.status(400).json({ error: 'Invalid responses format' });
  }

  try {
    for (const response of responses) {
      await pool.query('INSERT INTO student_responses (question_id, selected_option) VALUES ($1, $2)', [response.question_id, response.selected_option]);
    }
    res.json({ message: 'Student responses saved successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/teacher-responses', async (req, res) => {
  const { responses } = req.body;
  
  if (!responses || !Array.isArray(responses)) {
    return res.status(400).json({ error: 'Invalid responses format' });
  }

  try {
    for (const response of responses) {
      await pool.query('INSERT INTO teacher_responses (question_id, selected_option) VALUES ($1, $2)', [response.question_id, response.selected_option]);
    }
    res.json({ message: 'Teacher responses saved successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/extra-responses', async (req, res) => {
  const { responses } = req.body;
  
  if (!responses || !Array.isArray(responses)) {
    return res.status(400).json({ error: 'Invalid responses format' });
  }

  try {
    for (const response of responses) {
      await pool.query('INSERT INTO extra_responses (question_id, selected_option) VALUES ($1, $2)', [response.question_id, response.selected_option]);
    }
    res.json({ message: 'Extra activities responses saved successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/responses', async (req, res) => {
  const { responses } = req.body;
  
  if (!responses || !Array.isArray(responses)) {
    return res.status(400).json({ error: 'Invalid responses format' });
  }

  try {
    for (const response of responses) {
      await pool.query('INSERT INTO general_responses (question_id, answer) VALUES ($1, $2)', [response.question_id, response.answer]);
    }
    res.json({ message: 'Survey responses saved successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});