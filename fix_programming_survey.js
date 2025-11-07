const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

async function fixProgrammingSurvey() {
  try {
    console.log('Fixing programming survey database...');
    
    await pool.query('DELETE FROM programming_questions');
    console.log('Cleared existing data.');
    
    const csvPath = path.join(__dirname, 'programming.csv');
    const csvData = fs.readFileSync(csvPath, 'utf8');
    const lines = csvData.split('\n').slice(1);
    
    let insertedCount = 0;
    for (const line of lines) {
      if (line.trim()) {
        const fields = parseCSVLine(line.replace(/\r$/, ''));
        
        if (fields.length >= 6) {
          const [question, optionA, optionB, optionC, optionD, category] = fields;
          
          if (question && optionA && optionB && optionC && optionD && category) {
            await pool.query(
              'INSERT INTO programming_questions (question_text, option_a, option_b, option_c, option_d, category) VALUES ($1, $2, $3, $4, $5, $6)',
              [question, optionA, optionB, optionC, optionD, category]
            );
            insertedCount++;
          }
        }
      }
    }
    
    console.log(`Inserted ${insertedCount} questions.`);
    
    const categories = await pool.query('SELECT DISTINCT category FROM programming_questions ORDER BY category');
    console.log('Categories:');
    categories.rows.forEach(row => console.log(`- ${row.category}`));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

fixProgrammingSurvey();