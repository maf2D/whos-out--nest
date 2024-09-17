import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { User } from './schemas/user.schema';
import { UserDto } from './dtos/user.dto';
import { UserQueryDto } from './dtos/user-query.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  // find a user by id
  async findOne(id: string) {
    const user = await this.userModel.findById(id);

    if (!user) {
      throw new NotFoundException(`No user found with id:${id}`);
    }

    return user;
  }

  // find all the users by some query params
  async findAll(userQueryDto: UserQueryDto) {
    const { searchStr, onVacation, onHolidays, skip, limit } = userQueryDto;
    const query: FilterQuery<User> = {};

    if (searchStr) {
      // fields that are searched
      const searchFields: (keyof User)[] = [
        'firstName',
        'lastName',
        'position',
      ];
      const regex = new RegExp(searchStr, 'i');

      query.$or = searchFields.map((field) => ({
        [field]: { $regex: regex },
      }));
    }

    if (onVacation !== undefined) query.onVacation = onVacation;
    if (onHolidays !== undefined) query.onHolidays = onHolidays;

    const [result] = await this.userModel.aggregate([
      {
        $facet: {
          // all the users
          users: [{ $match: query }, { $skip: skip }, { $limit: limit }],

          // count of users that are on vacation
          usersOnVacation: [
            { $match: { onVacation: true } },
            { $count: 'count' },
          ],

          // count of users that are on holidays
          usersOnHolidays: [
            { $match: { onHolidays: true } },
            { $count: 'count' },
          ],

          // count of all the users
          totalUsers: [{ $count: 'count' }],
        },
      },
    ]);

    // users response
    return {
      users: result.users,
      usersOnVacation: result.usersOnVacation[0]?.count || 0,
      usersOnHolidays: result.usersOnHolidays[0]?.count || 0,
      totalUsers: result.totalUsers[0]?.count || 0,
    };
  }

  // create a user
  async createOne(userDto: UserDto) {
    return this.userModel.create(userDto);
  }

  // delete a user
  async deleteOne(id: string) {
    const user = await this.userModel.findByIdAndDelete(id);

    if (!user) {
      throw new NotFoundException(`No user found with id:${id}`);
    }

    return null;
  }
}
