import dbConnection from "../config/db.js";
import Mosque from "../models/mosque.js";
import mosqueProfile from "../models/mosqueProfile.js";
import AppError from "../utils/AppError.js";

export const registerMosque = async(req, res, next) => {
    const transaction = await dbConnection.transaction();
    try{
        const {name, country, state, localGovernment, description} = req.body;
        const userId = req.user.id;
        
        const mosque = await Mosque.findOne({where: {adminId: userId}});

        if(mosque){
            await transaction.rollback();
           return next(new AppError('You have already registered a mosque', 400));
        };
        
        const newMosque = await Mosque.create({
            name,
            country,
            state,
            localGovernment,
            description,
            status: 'pending',
            adminId: userId
        }, { transaction });

        const profileMosque = await mosqueProfile.create({
            mosqueId: newMosque.id,
            image: process.env.MOSQUE_DEFAULT_IMAGE
        }, { transaction });

        await transaction.commit();

        res.status(201).json({
            status: 'success',
           mosque: newMosque,
            mosqueProfile: profileMosque.image
        });
    }
    catch(err){ 
       await transaction.rollback();
        console.error(err.message);
        next(new AppError(process.env.NODE_ENV === 'development' ? err.message : 'something went wrong', 500))
    }
};

export const getMosque = async(req, res, next) => {
    try{
        const mosques = await Mosque.findAll({include: {model: mosqueProfile, as: 'mosqueProfile', attributes: ['image']}});
        res.status(200).json({
            status: 'success',
            message: 'mosque fetched successfully',
            mosques
        });
    }
    catch(err){
        process.env.NODE_ENV === 'develpment' 
            ? err.message : 'something went wrong'
    }
};