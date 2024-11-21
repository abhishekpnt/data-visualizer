const express = require('express');
const cors = require('cors');
const mockData = require('../public/mock/data.json');
const groupingConfig = require('./grouping.config');

const app = express();
app.use(cors());

const pool = {
  query: async (query, values) => {
    let filteredData = mockData;
    // console.log('=====values',values)

    if (values.typeIdentifier) {

      filteredData = filteredData.filter(item =>{  
            // console.log('=====item',item)
       return item.type === values.typeIdentifier});
    }
    // console.log('fd',filteredData)
    if (values.year) {
      filteredData = filteredData.filter(item => {
        const itemYear = new Date(item.enrolled_on).getFullYear();
        return itemYear === parseInt(values.year);
      });
    }
    if (values.month) {
      filteredData = filteredData.filter(item => {
        const itemMonth = new Date(item.enrolled_on).getMonth() + 1; // Months are zero-based
        return itemMonth === parseInt(new Date(`${values.month} 1, 2020`).getMonth() + 1);
      });
    }
    if (values.org) {
      filteredData = filteredData.filter(item => {
         return item.org_id === values.org;
      });
    }

    console.log('filtered',filteredData)
    return { rows: filteredData };
  }
};

function buildInitialHierarchy() {
  return {
    name: 'root',
    children: [
      {
        name: 'Event',
        count: 10,
        children: [{ name: 2024, count: 10 }]
      },
      {
        name: 'Course',
        count: 29,
        children: [
          { name: 2025, count: 14 },
          { name: 2024, count: 15 }
        ]
      }
    ]
  };
}

app.get('/user-activity', async (req, res) => {
  const { typeIdentifier, year, month,org } = req.query;
  console.log('year',year)
  console.log('typeIdentifier',typeIdentifier)
  console.log('month',month)
  console.log('org',org)

  if (!typeIdentifier && !year && !month)  {
    // Initial data load
    return res.json(buildInitialHierarchy());
  }

  try {
    const values = { typeIdentifier, year, month, org };
    const result = await pool.query('', values);
    const data = result.rows;
  
    // Group data by month or org_id, then sum counts
    const groupedData = data.reduce((acc, item) => {
      // Determine the key based on month or org_id
      // const key = !month ? new Date(item.enrolled_on).toLocaleString('default', { month: 'short' }) : item.org_id || 'Unknown';
  
      if (org) {
        // Use type_identifier if at the org level
        key = item.type_identifier || 'Unknown Type';
      } else if (month) {
        // Use a month-level grouping
        key= item.org_id 
      } else {
        // Fallback if month/org isn't available
        key = new Date(item.enrolled_on).toLocaleString('default', { month: 'short' });
      }
      // Check if the group already exists in the accumulator
      if (!acc[key]) {
        acc[key] = { name: key, count: 0 };
      }
  
      // Increase the count for this group
      acc[key].count += item.count || 1;
  
      return acc;
    }, {});

    console.log('----',groupedData)
  
    // Convert groupedData object into an array
    const hierarchy = Object.values(groupedData);
  
    // Return the hierarchy as JSON response
    res.json(hierarchy);
  
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
  
});

app.listen(3000, () => console.log('Server running on port 3000'));
