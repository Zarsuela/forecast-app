const { faker } = require('@faker-js/faker');
const fs = require("fs");

// Create 100 fake products
const products = [];

for (let i = 0; i < 100; i++) {
  products.push({
    id: i + 1,
    name: faker.commerce.productName(),
    inventory: faker.number.int({ min: 0, max: 100 }),
    avgSales: faker.number.int({ min: 5, max: 50 }),
    leadTime: faker.number.int({ min: 1, max: 14 }) // days to replenish
  });
}

const data = { products };

// Save to db.json
fs.writeFileSync("mock/db.json", JSON.stringify(data, null, 2));

console.log("Mock data generated successfully!");
