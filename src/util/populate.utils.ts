import { PopulateOptions } from 'mongoose';

export const bookRequestPopulateOptions: PopulateOptions = {
  path: 'userBook',
  populate: [
    { path: 'book' },
    { path: 'owner', select: 'username profilePic' },
  ],
  select: 'book owner',
};

export const transformBookRequest = (request: any) => {
  const {
    _id,
    userBook,
    status,
    statusHistory,
    currentPage,
    dueDate,
    pictureRequired,
  } = request;
  return {
    _id: userBook._id,
    book: userBook.book,
    owner: userBook.owner,
    request: {
      pictureRequired,
      statusHistory,
      status,
      _id: _id.toString(),
      ...(request.sender && { sender: request.sender }),
    },
    currentPage,
    dueDate,
  };
};
