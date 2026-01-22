import userProfile from "./userProfile.js";
import User from "./user.js";
import Mosque from "./mosque.js";
import mosqueProfile from "./mosqueProfile.js";
import Category from "./category.js";
// user and profile
User.hasOne(userProfile, {
    as: 'userProfile',
    foreignKey: 'userId', 
    onDelete: 'CASCADE'
});

userProfile.belongsTo(User, {
    as: 'userProfile',
    foreignKey: 'userId' 
});

// mosque and profile
Mosque.hasOne(mosqueProfile, {
    as: 'mosqueProfile',
    foreignKey: 'mosqueId',
    onDelete: 'CASCADE'
});
mosqueProfile.belongsTo(Mosque, {
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