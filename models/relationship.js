import UserProfile from "./userProfile.js";
import User from "./user.js";
import Mosque from "./mosque.js";
import MosqueProfile from "./mosqueProfile.js";
import Category from "./category.js";
import CategoryProfile from "./categoryProfile.js";
import Lecture from "./Lecture.js";
import FollowMosque from "./followMosque.js";
import MosqueAdmin from "./mosqueAdmin.js";
import Announcement from "./announcement.js";
import Notification from "./notification.js";
import Bookmark from './bookmark.js';
import Report from "./report.js";
import VideoLibrary from "./videoLibrary.js";
import Feedback from "./feedback.js";

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
    foreignKey: 'mosqueId' 
});
MosqueProfile.belongsTo(Mosque, {
    as: 'mosqueProfile',
    foreignKey: 'mosqueId'
});



// mosque and category
Mosque.hasMany(Category, {
    foreignKey: 'mosqueId',
    as: 'mosqueCategory'
});

Category.belongsTo(Mosque, {
    foreignKey: 'mosqueId',
    as: 'mosqueCategory'
});



// category and category profile
Category.hasOne(CategoryProfile, {
    as: 'categoryProfile',
    foreignKey: 'categoryId', //delete onDelete let manually delete
});

CategoryProfile.belongsTo(Category, {
    as: 'categoryProfile',
    foreignKey: 'categoryId'
});

// lacture and category
Category.hasMany(Lecture, {
  foreignKey: 'categoryId',
  as: 'lectures'
});

Lecture.belongsTo(Category, {
  foreignKey: 'categoryId',
  as: 'category'
});  

// user follows mosques
User.hasMany(FollowMosque, {
    foreignKey: 'userId',
    as: 'followedMosques',
    onDelete: 'CASCADE'
});

FollowMosque.belongsTo(User, {
    foreignKey: 'userId',
    as: 'follower'
});

Mosque.hasMany(FollowMosque, {
    foreignKey: 'mosqueId',
    as: 'followers',
    onDelete: 'CASCADE'
});

FollowMosque.belongsTo(Mosque, {
    foreignKey: 'mosqueId',
    as: 'mosque'
});

User.belongsToMany(Mosque, {
    through: FollowMosque,
    foreignKey: 'userId',
    otherKey: 'mosqueId',
    as: 'followingMosques'
});

Mosque.belongsToMany(User, {
    through: FollowMosque,
    foreignKey: 'mosqueId',
    otherKey: 'userId',
    as: 'followersUsers'
});

// mosque admin many-to-many relationship
User.belongsToMany(Mosque, {
    through: MosqueAdmin,
    foreignKey: "userId",
    otherKey: "mosqueId",
    as: "managedMosques",
  });

  Mosque.belongsToMany(User, {
    through: MosqueAdmin,
    foreignKey: "mosqueId",
    otherKey: "userId",
    as: "admins",
  });

  // 2. Optional but helpful: Direct links for specific queries
  MosqueAdmin.belongsTo(User, { foreignKey: "userId", as: "user" });
  MosqueAdmin.belongsTo(Mosque, { foreignKey: "mosqueId", as: "mosque" });

Mosque.hasMany(MosqueAdmin, {foreignKey: 'mosqueId', as: 'mosquAdmin'})


  Mosque.hasMany(Announcement, { 
        foreignKey: 'mosqueId', 
        as: 'announcements'
    });
    Announcement.belongsTo(Mosque, { 
        foreignKey: 'mosqueId',
        as: 'mosque'
    });

    
    // 1. Linking notification to Mosque 
    Mosque.hasMany(Notification, { foreignKey: 'mosqueId', onDelete: 'CASCADE' });
    Notification.belongsTo(Mosque, { foreignKey: 'mosqueId' });

    // 2. Linking to Announcement (The Target)
    // If an Announcement is deleted, its notification is deleted automatically
    Announcement.hasMany(Notification, { 
        foreignKey: 'announcementId', 
        onDelete: 'CASCADE',
        hooks: true 
    });
    Notification.belongsTo(Announcement, { foreignKey: 'announcementId' });

    // 3. Linking to Lecture (The Target)
    // If a Lecture is deleted, its notification is deleted automatically
    Lecture.hasMany(Notification, { 
        foreignKey: 'lecture_id', 
        onDelete: 'CASCADE'
    });
    Notification.belongsTo(Lecture, { foreignKey: 'lecture_id' });


// User <-> Bookmark
User.hasMany(Bookmark, { foreignKey: 'userId', as: 'bookmarks', onDelete: 'CASCADE' });
Bookmark.belongsTo(User, { foreignKey: 'userId', as: 'user' }); // 👈 Changed alias to 'user'

// Lecture <-> Bookmark
Lecture.hasMany(Bookmark, { foreignKey: 'lectureId', as: 'bookmarks', onDelete: 'CASCADE' });
Bookmark.belongsTo(Lecture, { foreignKey: 'lectureId', as: 'lecture' }); // 👈 Changed alias to 'lecture'

// This allows us to see the Mosque name when looking at bookmarks

// report
// Report Relationships
User.hasMany(Report, { foreignKey: 'reporterId', as: 'reports' });
Report.belongsTo(User, { foreignKey: 'reporterId', as: 'reporter' });

Mosque.hasMany(Report, { foreignKey: 'mosqueId', onDelete: 'CASCADE' });
Report.belongsTo(Mosque, { foreignKey: 'mosqueId' });


// Define the Relationships
// A User can have many Feedbacks
User.hasMany(Feedback, {
  foreignKey: 'userId',
  as: 'feedbacks', // Optional alias
  onDelete: 'CASCADE'
});

// A Feedback belongs to one User
Feedback.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user' // This is what you will use in your 'include' query
});

User.hasMany(VideoLibrary, { foreignKey: 'userId', as: 'libraryItems', onDelete: 'CASCADE' });
VideoLibrary.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// change alias of videoLibrary with lecture from 'lecture' to 'lectureLibrary'
Lecture.hasMany(VideoLibrary, { foreignKey: 'lectureId', as: 'librarySaves' });
VideoLibrary.belongsTo(Lecture, { foreignKey: 'lectureId', as: 'lectureLibrary' });


export { 
  User, 
  UserProfile, 
  Mosque, 
  MosqueProfile, 
  Category, 
  CategoryProfile, 
  Lecture, 
  FollowMosque, 
  MosqueAdmin, 
  Announcement, 
  Notification, 
  Bookmark, 
  Report, 
  Feedback,
  VideoLibrary
};