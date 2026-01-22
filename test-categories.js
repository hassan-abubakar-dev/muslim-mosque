/*
 * Test script for Categories API
 * This script demonstrates how to use the Categories API endpoints
 */

console.log("Categories API Test Script");
console.log("==========================");
console.log("API Endpoints:");
console.log("");
console.log("GET    /api/categories          - Get all active categories");
console.log("GET    /api/categories/:id      - Get a specific category by ID");
console.log("POST   /api/categories          - Create a new category (Admin only)");
console.log("PUT    /api/categories/:id      - Update a category (Admin only)");
console.log("DELETE /api/categories/:id      - Delete a category (Admin only)");
console.log("");
console.log("Admin Authentication Required:");
console.log("- Include Authorization header: 'Bearer <token>'");
console.log("- User must have 'admin' role");
console.log("");
console.log("Example POST body for creating a category:");
console.log('{');
console.log('  "name": "Quran",');
console.log('  "description": "Quran related content"');
console.log('}');
console.log("");
console.log("Example PUT body for updating a category:");
console.log('{');
console.log('  "name": "Quran Study",');
console.log('  "description": "Detailed Quran study materials",');
console.log('  "isActive": true');
console.log('}');