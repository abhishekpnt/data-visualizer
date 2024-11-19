const express = require('express');
const app = express();
const cors = require('cors');
const mockData = require('../public/mock/data.json'); // Assuming mock data is in this location
const groupingConfig = require('./grouping.config'); // Import groupingConfig

app.use(cors());

const pool = {
  query: async (query, values) => {
    let filteredData = mockData;
    if (values[0]) {
      filteredData = filteredData.filter(item => item.type_identifier === values[0]);
    }
    if (values[1]) {
      filteredData = filteredData.filter(item => item.org_id === values[1]);
    }
    return { rows: filteredData };
  }
};

// Recursive function to build hierarchy dynamically
function buildHierarchy(data, config, level = 0) {
  if (level >= config.length) {
    // Base case: leaf nodes
    return data.map(item => ({
      ...item,
      name: item.type_identifier,
      size: 100, 
      value: 10
    }));
  }

  const { key, default: defaultValue, format } = config[level];
  const groupedData = data.reduce((acc, item) => {
    const value = format ? format(item[key]) : item[key] || defaultValue;
    if (!acc[value]) acc[value] = [];
    acc[value].push(item);
    return acc;
  }, {});

  return Object.keys(groupedData).map(groupKey => ({
    name: groupKey,
    children: buildHierarchy(groupedData[groupKey], config, level + 1)
  }));
}

app.get('/user-activity', async (req, res) => {
  const { typeIdentifier, orgId } = req.query;

  try {
    const query = `
      SELECT *
      FROM user_activity
      WHERE type_identifier = $1 OR org_id = $2
    `;
    const values = [typeIdentifier, orgId];

    const result = await pool.query(query, values);
    const data = result.rows;

    // Build hierarchy dynamically
    const hierarchy = {
      name: 'root',
      children: buildHierarchy(data, groupingConfig) // Use imported config here
    };

    // Return the built hierarchy
    res.json(hierarchy);
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
});

app.listen(3000, () => console.log('Server running on port 3000'));
