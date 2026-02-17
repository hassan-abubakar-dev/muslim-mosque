import UserProfile from "./userProfile.js";
import User from "./user.js";
import Mosque from "./mosque.js";
import MosqueProfile from "./mosqueProfile.js";
import Category from "./category.js";
import CategoryProfile from "./categoryProfile.js";
import Lecture from "./Lecture.js";
// user and profile
User.hasOne(UserProfile, {
    as: 'userProfile',
    foreignKey: 'userId', 
    onDelete: 'CASCADE'
});

UserProfile.belongsTo(User, {
    as: 'userProfile',
    foreignKey: 'userId' 
});

// mosque and profile
Mosque.hasOne(MosqueProfile, {
    as: 'mosqueProfile',
    foreignKey: 'mosqueId',
    onDelete: 'CASCADE'
});
MosqueProfile.belongsTo(Mosque, {
    as: 'mosqueProfile',
    foreignKey: 'mosqueId'
});

// user and mosque as admin
User.hasMany(Mosque, {
    as: 'admin',
    foreignKey: 'adminId'
});

Mosque.belongsTo(User, {
    as: 'admin',
    foreignKey: 'adminId'
});

// mosque and category
Mosque.hasMany(Category, {
    foreignKey: 'mosqueId',
    as: 'mosqueCategory',
    onDelete: 'CASCADE'
});

Category.belongsTo(Mosque, {
    foreignKey: 'mosqueId',
    as: 'mosqueCategory'
});

// category and category profile
Category.hasOne(CategoryProfile, {
    as: 'categoryProfile',
    foreignKey: 'categoryId',
    onDelete: 'CASCADE'
});

CategoryProfile.belongsTo(Category, {
    as: 'categoryProfile',
    foreignKey: 'categoryId'
});

// lacture and category
Category.hasMany(Lecture, {
  foreignKey: 'categoryId',
  as: 'lectures',
  onDelete: 'CASCADE'
});

Lecture.belongsTo(Category, {
  foreignKey: 'categoryId',
  as: 'category'
});  