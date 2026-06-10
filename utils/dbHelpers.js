import { Op } from 'sequelize';
import dbConnection from '../config/db';


// Check if we are using Postgres
const isPostgres = dbConnection.getDialect() === 'postgres';

/**
 * Returns the case-insensitive LIKE operator based on the DB dialect.
 * Postgres uses 'iLike', MySQL/others use 'like' (often case-insensitive by default).
 */
const getLikeOperator = () => {
  return isPostgres ? Op.iLike : Op.like;
};

export default getLikeOperator;