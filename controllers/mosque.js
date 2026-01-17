import Mosque from "../models/mosque.js";
import AppError from "../utils/AppError.js";

export const registerMosque = async(req, res, next) => {
    try{
        const {name, country, state, localGovernment, description, adminEmail} = req.body;
        const newMosque = await Mosque.create({
            name,
            country,
            state,
            localGovernment,
            description,
            adminEmail,
            isVerify: false
        });
    }
    catch(err){
        console.error(err.message);
        next(new AppError(process.env.NODE_ENV === 'development' ? err.message : 'something went wrong', 500))
    }
}