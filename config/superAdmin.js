import bcrypt from 'bcryptjs';
import User from '../models/user.js';
import dotenv from 'dotenv';
import userProfile from '../models/userProfile.js';
dotenv.config();

const superAdmin = async () => {
    const firstName = process.env.SUPER_ADMIN_FIST_NAME;
     const surName = process.env.SUPER_ADMIN_SUR_NAME;
    const email = process.env.SUPER_ADMIN_EMAIL;
    const password = process.env.SUPER_ADMIN_PASSWORD;
    
    const superAdminExits = await User.findOne({ where: { email, role: 'superAdmin' } });

    if(superAdminExits) {
        console.log('Super Admin already exists');
        return;
    }
  try{
    const hashPassword = await bcrypt.hash(password, 12);
    const newUser = await User.create({
        firstName,
        surName,
        email,  
        password: hashPassword,
        role: 'superAdmin',
        gender: 'male',
        isVerified: true
    }); 

    const profileImage = process.env.SUPER_ADMIN_PROFILE || process.env.SUPER_ADMIN_PROFILE;

    await userProfile.create({
        userId: newUser.id,
        image: profileImage
    });
    console.log('Super Admin created successfully');
    
  }
  catch(err){
      console.error('Error creating Super Admin:', err.message);
  }

}

export default superAdmin;