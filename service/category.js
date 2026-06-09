
import { Category, CategoryProfile, Lecture } from '../models/relationship.js';
import cloudinary from '../config/claudinary.js';
import { deleteFileFromR2 } from '../utils/r2.js';

export const performCategoryCleanup = async (categoryId, transaction) => {
  // 1. Fetch data
  const category = await Category.findByPk(categoryId, { transaction });
  if (!category) throw new Error("Category not found");

  const categoryProfile = await CategoryProfile.findOne({ where: { categoryId }, transaction });
  const lectures = await Lecture.findAll({ where: { categoryId }, transaction });

  // 2. Cloudinary Cleanup
  if (categoryProfile?.publicId) {
    await cloudinary.uploader.destroy(categoryProfile.publicId);
  }

  // 3. R2 Cleanup
  if (lectures.length > 0) {
    await Promise.all(lectures.map(async (lecture) => {
      try {
        await deleteFileFromR2(lecture.publicId);
      } catch (err) {
        throw new Error(`Failed to delete lecture file: ${err.message}`);
      }
    }));
  }

  // 4. Database Cleanup
  if (categoryProfile) await categoryProfile.destroy({ transaction });
  await Lecture.destroy({ where: { categoryId }, transaction });
  await category.destroy({ transaction });
};

export default performCategoryCleanup;