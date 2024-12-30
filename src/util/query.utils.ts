import { QueryOptions } from 'mongoose';

export const notificationQueryOptions: QueryOptions = {
  sort: '-createdAt',
  populate: [
    {
      path: 'user',
      select: 'profilePic username',
    },
    {
      path: 'requestRef',
      select: '_id status',
      options: { lean: true },
    },
  ],
  select: '-updatedAt -recipient',
};
