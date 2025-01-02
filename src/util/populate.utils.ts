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
  const { _id, userBook, status, statusHistory, currentPage, dueDate } =
    request;
  return {
    _id: userBook._id,
    book: userBook.book,
    owner: userBook.owner,
    statusHistory,
    request: {
      status,
      _id: _id.toString(),
      ...(request.sender && { sender: request.sender }),
    },
    currentPage,
    dueDate,
  };
};
